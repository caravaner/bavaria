import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { paypalEnv } from "@/lib/env";
import {
  verifyWebhookSignature,
  type WebhookSignatureHeaders,
} from "@/lib/paypal";

/**
 * PayPal webhook receiver.
 *
 * Trust model:
 *   1. Every event is signature-verified via PayPal's verify-webhook-signature API.
 *      Without this, anyone could forge "payment completed" events.
 *   2. Events are deduplicated by PayPal's event id (primary key on WebhookEvent).
 *      Duplicate deliveries are silently accepted as no-ops.
 *   3. Order state changes are applied idempotently — re-processing the same event
 *      after a crash mid-processing is safe.
 *
 * Non-2xx response → PayPal retries with exponential backoff (~3 days).
 * 2xx response → PayPal considers the event delivered.
 */
export async function POST(req: Request) {
  // Read raw body up front — we need it as a string for response (so callers
  // can debug) and as parsed JSON for processing.
  const rawBody = await req.text();

  let event: PayPalWebhookEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!event?.id || !event?.event_type) {
    return NextResponse.json({ error: "malformed_event" }, { status: 400 });
  }

  // 1. Signature verification ────────────────────────────────────────────────
  const headers: WebhookSignatureHeaders = {
    transmissionId: req.headers.get("paypal-transmission-id") ?? "",
    transmissionTime: req.headers.get("paypal-transmission-time") ?? "",
    certUrl: req.headers.get("paypal-cert-url") ?? "",
    authAlgo: req.headers.get("paypal-auth-algo") ?? "",
    transmissionSig: req.headers.get("paypal-transmission-sig") ?? "",
  };

  let webhookId: string;
  try {
    webhookId = paypalEnv.webhookId;
  } catch {
    console.error(
      "[webhook] PAYPAL_WEBHOOK_ID is not set — refusing to process events",
    );
    return NextResponse.json(
      { error: "webhook_not_configured" },
      { status: 500 },
    );
  }

  const valid = await verifyWebhookSignature({
    headers,
    webhookId,
    webhookEvent: event,
  });
  if (!valid) {
    console.warn("[webhook] signature verification FAILED", {
      eventId: event.id,
      eventType: event.event_type,
    });
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  // 2. Idempotent insert into the event log ──────────────────────────────────
  try {
    await db.webhookEvent.create({
      data: {
        id: event.id,
        eventType: event.event_type,
        payload: event as unknown as object,
      },
    });
  } catch (err) {
    // P2002 = unique constraint violation = we've seen this event before.
    if (isUniqueViolation(err)) {
      return NextResponse.json({ status: "duplicate" });
    }
    console.error("[webhook] failed to insert WebhookEvent", err);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  // 3. Apply the state change ────────────────────────────────────────────────
  try {
    await processEvent(event);
    await db.webhookEvent.update({
      where: { id: event.id },
      data: { processedAt: new Date(), status: "PROCESSED" },
    });
  } catch (err) {
    console.error("[webhook] processing failed", {
      eventId: event.id,
      eventType: event.event_type,
      err,
    });
    await db.webhookEvent.update({
      where: { id: event.id },
      data: { status: "FAILED", error: String(err) },
    });
    // 5xx so PayPal retries.
    return NextResponse.json({ error: "processing_failed" }, { status: 500 });
  }

  return NextResponse.json({ status: "ok" });
}

// ─── Event dispatch ─────────────────────────────────────────────────────────

async function processEvent(event: PayPalWebhookEvent) {
  switch (event.event_type) {
    case "PAYMENT.CAPTURE.COMPLETED":
      return handleCaptureCompleted(event);
    case "PAYMENT.CAPTURE.DENIED":
      return handleCaptureDenied(event);
    case "PAYMENT.CAPTURE.REFUNDED":
    case "PAYMENT.CAPTURE.REVERSED":
      return handleRefundOrReversal(event);
    case "CUSTOMER.DISPUTE.CREATED":
      return handleDisputeCreated(event);
    default:
      console.log("[webhook] unhandled event_type:", event.event_type);
  }
}

async function handleCaptureCompleted(event: PayPalWebhookEvent) {
  const order = await findOrderFromResource(event.resource);
  if (!order) {
    console.warn("[webhook] CAPTURE.COMPLETED: no matching Order", event.id);
    return;
  }
  // Happy path almost always already marked CAPTURED by the API capture flow.
  // This webhook is the reconciliation backstop.
  if (order.status === "CAPTURED") return;
  await db.order.update({
    where: { id: order.id },
    data: { status: "CAPTURED", capturedAt: new Date() },
  });
  console.log("[webhook] reconciled Order to CAPTURED", { orderId: order.id });
  // TODO: confirmation email if it wasn't already sent by the capture handler.
}

async function handleCaptureDenied(event: PayPalWebhookEvent) {
  const order = await findOrderFromResource(event.resource);
  if (!order) return;
  if (order.status === "CAPTURED" || order.status === "REFUNDED") return;
  await db.order.update({
    where: { id: order.id },
    data: { status: "FAILED" },
  });
}

async function handleRefundOrReversal(event: PayPalWebhookEvent) {
  const order = await findOrderFromResource(event.resource);
  if (!order) {
    console.warn("[webhook] REFUND/REVERSE: no matching Order", event.id);
    return;
  }
  await db.order.update({
    where: { id: order.id },
    data: { status: "REFUNDED", refundedAt: new Date() },
  });
  console.log("[webhook] marked Order REFUNDED", { orderId: order.id });
  // TODO: notify Ibukun + the buyer that the refund completed.
}

async function handleDisputeCreated(event: PayPalWebhookEvent) {
  // No DB state change for now — disputes don't automatically refund.
  // Future: email Ibukun with the dispute id and link.
  console.warn("[webhook] CUSTOMER.DISPUTE.CREATED", {
    eventId: event.id,
    resourceId: event.resource?.id,
  });
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Find our Order from a PayPal event resource.
 * Tries custom_id first (set when we create orders), falls back to the
 * supplementary_data PayPal order id.
 */
async function findOrderFromResource(resource: PayPalResource | undefined) {
  if (!resource) return null;

  if (typeof resource.custom_id === "string" && resource.custom_id) {
    const order = await db.order.findUnique({
      where: { id: resource.custom_id },
    });
    if (order) return order;
  }

  const paypalOrderId = resource.supplementary_data?.related_ids?.order_id;
  if (paypalOrderId) {
    const order = await db.order.findUnique({ where: { paypalOrderId } });
    if (order) return order;
  }

  return null;
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: unknown }).code === "P2002"
  );
}

// ─── Types ──────────────────────────────────────────────────────────────────

type PayPalResource = {
  id?: string;
  custom_id?: string;
  status?: string;
  amount?: { currency_code?: string; value?: string };
  supplementary_data?: {
    related_ids?: {
      order_id?: string;
    };
  };
};

type PayPalWebhookEvent = {
  id: string;
  event_type: string;
  resource?: PayPalResource;
  create_time?: string;
  resource_type?: string;
};
