import { NextResponse } from "next/server";
import { db, getServiceDTO } from "@bavaria/db";
import { createOrder } from "@/lib/paypal";
import { hasInternalSecret } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ORDER_ID_TOKEN = "__ORDER_ID__";

type CreateOrderBody = {
  slug?: string;
  name?: string;
  email?: string;
  notes?: string | null;
  locale?: string;
  /** Absolute URL containing the literal token __ORDER_ID__, replaced post-create. */
  returnUrlTemplate?: string;
  cancelUrl?: string;
};

/**
 * Create a booking Order and its PayPal order. Internal endpoint — only the web
 * server (holding the shared secret) may call it; the price is authoritative
 * here, never trusted from the client.
 */
export async function POST(req: Request) {
  if (!hasInternalSecret(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: CreateOrderBody;
  try {
    body = (await req.json()) as CreateOrderBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const slug = String(body.slug ?? "");
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  const notes = String(body.notes ?? "").trim();
  const locale = String(body.locale ?? "en");
  const returnUrlTemplate = String(body.returnUrlTemplate ?? "");
  const cancelUrl = String(body.cancelUrl ?? "");

  // Authoritative server-side validation.
  if (!name || name.length > 200) {
    return NextResponse.json({ error: "invalid_name" }, { status: 400 });
  }
  if (!email || !EMAIL_RE.test(email) || email.length > 320) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }
  if (notes.length > 4000) {
    return NextResponse.json({ error: "invalid_notes" }, { status: 400 });
  }
  if (!returnUrlTemplate.includes(ORDER_ID_TOKEN) || !cancelUrl) {
    return NextResponse.json({ error: "invalid_urls" }, { status: 400 });
  }

  // Server-authoritative service lookup (active services only).
  const service = await getServiceDTO(slug, locale, true);
  if (!service) {
    return NextResponse.json({ error: "service_not_found" }, { status: 404 });
  }

  // Create local Order first, then the PayPal order keyed to it.
  const order = await db.order.create({
    data: {
      serviceSlug: service.slug,
      amountCents: service.priceCents,
      currency: service.currency,
      guestEmail: email,
      guestName: name,
      notes: notes || null,
    },
  });

  try {
    const paypalOrder = await createOrder({
      localOrderId: order.id,
      amountCents: service.priceCents,
      currency: service.currency,
      description: service.slug,
      returnUrl: returnUrlTemplate.replaceAll(ORDER_ID_TOKEN, order.id),
      cancelUrl,
    });

    await db.order.update({
      where: { id: order.id },
      data: { paypalOrderId: paypalOrder.id },
    });

    return NextResponse.json({
      orderId: order.id,
      paypalOrderId: paypalOrder.id,
    });
  } catch (err) {
    await db.order.update({
      where: { id: order.id },
      data: { status: "FAILED" },
    });
    console.error("[orders] createOrder failed", err);
    return NextResponse.json({ error: "create_order_failed" }, { status: 502 });
  }
}
