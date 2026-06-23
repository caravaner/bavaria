/**
 * Order/booking calls to the admin API. All server-side; the web app holds the
 * internal secret but never the database.
 */

import { apiBaseUrl, internalSecretHeader } from "./api";

export type CreateOrderResult =
  | { ok: true; orderId: string; paypalOrderId: string }
  | { ok: false; error: string };

export async function createBookingOrder(input: {
  slug: string;
  name: string;
  email: string;
  notes: string;
  locale: string;
  /** Absolute URL containing the literal token __ORDER_ID__. */
  returnUrlTemplate: string;
  cancelUrl: string;
}): Promise<CreateOrderResult> {
  try {
    const res = await fetch(`${apiBaseUrl()}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...internalSecretHeader(),
      },
      body: JSON.stringify(input),
      cache: "no-store",
    });
    const data = (await res.json().catch(() => ({}))) as {
      orderId?: string;
      paypalOrderId?: string;
      error?: string;
    };
    if (!res.ok || !data.orderId || !data.paypalOrderId) {
      return { ok: false, error: data.error ?? "create_failed" };
    }
    return {
      ok: true,
      orderId: data.orderId,
      paypalOrderId: data.paypalOrderId,
    };
  } catch (err) {
    console.error("[web] createBookingOrder error", err);
    return { ok: false, error: "network_error" };
  }
}

export type OrderStatus =
  | "CREATED"
  | "APPROVED"
  | "CAPTURED"
  | "FAILED"
  | "REFUNDED";

export type OrderSummary = {
  id: string;
  status: OrderStatus;
  paypalOrderId: string | null;
  serviceSlug: string;
  serviceTitle: string;
  amountCents: number;
  currency: string;
  guestName: string;
  guestEmail: string;
};

export async function fetchOrder(
  id: string,
  locale = "en",
): Promise<OrderSummary | null> {
  try {
    const res = await fetch(
      `${apiBaseUrl()}/api/orders/${encodeURIComponent(id)}?locale=${encodeURIComponent(locale)}`,
      { headers: internalSecretHeader(), cache: "no-store" },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { order: OrderSummary };
    return data.order;
  } catch (err) {
    console.error("[web] fetchOrder error", err);
    return null;
  }
}

export async function captureOrder(
  id: string,
): Promise<{ ok: boolean; status: number }> {
  try {
    const res = await fetch(
      `${apiBaseUrl()}/api/orders/${encodeURIComponent(id)}/capture`,
      { method: "POST", headers: internalSecretHeader(), cache: "no-store" },
    );
    return { ok: res.ok, status: res.status };
  } catch (err) {
    console.error("[web] captureOrder error", err);
    return { ok: false, status: 0 };
  }
}
