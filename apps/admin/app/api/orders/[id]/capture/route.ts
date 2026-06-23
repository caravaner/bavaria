import { NextResponse } from "next/server";
import { db, getServiceDTO } from "@bavaria/db";
import { captureOrder, PayPalError } from "@/lib/paypal";
import { hasInternalSecret } from "@/lib/api-auth";
import { sendOrderConfirmation, sendOwnerBookingNotice } from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * Capture endpoint — invoked (via the web app's same-origin proxy) from the
 * PayPal Smart Buttons onApprove callback.
 *
 * Trust model:
 *   1. Only the local Order id (the route param) identifies the order; price,
 *      currency, and PayPal order id are all read from our DB.
 *   2. The PayPal capture response is the source of truth for success.
 *   3. We verify captured amount/currency/custom_id against the DB row.
 *   4. Internal-secret gated: the browser hits the web proxy, which forwards
 *      here server-to-server.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!hasInternalSecret(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id: localOrderId } = await params;

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
  // Include inactive: a service deactivated mid-flight must not reject a payment
  // for an order created while it was live.
  const service = await getServiceDTO(order.serviceSlug, "en", false);
  if (!service || service.priceCents !== order.amountCents) {
    await db.order.update({
      where: { id: order.id },
      data: { status: "FAILED" },
    });
    return NextResponse.json({ error: "price_mismatch" }, { status: 409 });
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
    return NextResponse.json({ error: "verification_failed" }, { status: 409 });
  }

  // Persist the success state.
  const updated = await db.order.update({
    where: { id: order.id },
    data: { status: "CAPTURED", capturedAt: new Date() },
  });

  // Confirmation (guest) + booking notice (owner) — best-effort. Failures are
  // logged to EmailMessage (resendable) and must never fail a good capture.
  try {
    await Promise.all([
      sendOrderConfirmation(updated),
      sendOwnerBookingNotice(updated),
    ]);
  } catch (err) {
    console.error("[capture] booking email error", { orderId: updated.id, err });
  }

  return NextResponse.json({ status: "CAPTURED", orderId: updated.id });
}
