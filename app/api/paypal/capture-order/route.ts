import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { captureOrder, PayPalError } from "@/lib/paypal";
import { findService } from "@/lib/services";

/**
 * Capture endpoint — called by the PayPal Smart Buttons onApprove callback.
 *
 * Trust model:
 *   1. Body provides only the local Order id. Everything else is read from our DB.
 *   2. PayPal capture response is the source of truth for "did payment succeed."
 *   3. We verify the captured amount/currency/custom_id matches our DB row.
 *      Mismatch → mark FAILED and refuse to confirm.
 *   4. State transition is in a single transaction so we can't half-update.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const localOrderId =
    body && typeof body === "object" && "localOrderId" in body
      ? String((body as { localOrderId: unknown }).localOrderId ?? "")
      : "";
  if (!localOrderId) {
    return NextResponse.json({ error: "missing_order_id" }, { status: 400 });
  }

  const order = await db.order.findUnique({ where: { id: localOrderId } });
  if (!order || !order.paypalOrderId) {
    return NextResponse.json({ error: "order_not_found" }, { status: 404 });
  }

  // Idempotent: if already captured, succeed without re-charging.
  if (order.status === "CAPTURED") {
    return NextResponse.json({ status: "CAPTURED" });
  }
  if (order.status === "REFUNDED" || order.status === "FAILED") {
    return NextResponse.json({ error: "order_finalized" }, { status: 409 });
  }

  // Verify the service still exists and matches the order's stored price.
  // This protects against price drift between order creation and capture.
  // findService ignores `active` so a service deactivated mid-flight doesn't
  // reject a payment for an order that was created while it was live.
  const service = findService(order.serviceSlug);
  if (!service || service.priceCents !== order.amountCents) {
    await db.order.update({
      where: { id: order.id },
      data: { status: "FAILED" },
    });
    return NextResponse.json(
      { error: "price_mismatch" },
      { status: 409 },
    );
  }

  // Capture with PayPal.
  let captured;
  try {
    captured = await captureOrder(order.paypalOrderId);
  } catch (err) {
    console.error("[capture] PayPal capture failed", err);
    await db.order.update({
      where: { id: order.id },
      data: { status: "FAILED" },
    });
    const status = err instanceof PayPalError ? err.status : 502;
    return NextResponse.json({ error: "paypal_capture_failed" }, { status });
  }

  // Verify the capture response matches our DB row.
  const unit = captured.purchase_units?.[0];
  const capture = unit?.payments?.captures?.[0];

  if (!capture) {
    await db.order.update({
      where: { id: order.id },
      data: { status: "FAILED" },
    });
    return NextResponse.json(
      { error: "capture_missing_in_response" },
      { status: 502 },
    );
  }

  // PayPal echoes custom_id on the capture object (and sometimes on the unit too).
  // Accept either location to be robust to API response shape variance.
  const echoedCustomId = capture.custom_id ?? unit?.custom_id;
  const customIdMatches = echoedCustomId === order.id;

  const currencyMatches = capture.amount.currency_code === order.currency;

  // Compare amounts numerically so "79" and "79.00" are equivalent.
  const capturedAmount = Number(capture.amount.value);
  const expectedAmount = order.amountCents / 100;
  const amountMatches =
    Number.isFinite(capturedAmount) &&
    Math.abs(capturedAmount - expectedAmount) < 0.005;

  if (!customIdMatches || !currencyMatches || !amountMatches) {
    console.error("[capture] verification mismatch", {
      orderId: order.id,
      captured: capture,
      unit_custom_id: unit?.custom_id,
      expected: {
        customId: order.id,
        currency: order.currency,
        value: expectedAmount.toFixed(2),
      },
      checks: { customIdMatches, currencyMatches, amountMatches },
    });
    await db.order.update({
      where: { id: order.id },
      data: { status: "FAILED" },
    });
    return NextResponse.json(
      { error: "verification_failed" },
      { status: 409 },
    );
  }

  // Persist the success state.
  const updated = await db.order.update({
    where: { id: order.id },
    data: { status: "CAPTURED", capturedAt: new Date() },
  });

  // TODO: send confirmation email via Resend.
  // For now, log what would be sent so we can verify the data is right.
  console.log("[booking] confirmation email pending", {
    to: updated.guestEmail,
    name: updated.guestName,
    service: updated.serviceSlug,
    orderId: updated.id,
    captureId: capture.id,
    amount: capture.amount,
  });

  return NextResponse.json({
    status: "CAPTURED",
    orderId: updated.id,
  });
}
