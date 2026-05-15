"use server";

import { headers } from "next/headers";
import { redirect } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { createOrder } from "@/lib/paypal";
import { getService } from "@/lib/services";

export type BookingFormState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Partial<Record<"name" | "email" | "notes", string>>;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function submitBooking(
  _prev: BookingFormState,
  formData: FormData,
): Promise<BookingFormState> {
  const t = await getTranslations("Booking.form.errors");
  const locale = await getLocale();

  // Honeypot
  if (formData.get("website")) {
    // Bots get silent failure (return idle).
    return { status: "idle" };
  }

  const slug = String(formData.get("slug") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  // Server-authoritative service lookup. The client cannot tell us the price.
  const service = getService(slug);
  if (!service) {
    return { status: "error", message: t("service") };
  }

  const fieldErrors: BookingFormState["fieldErrors"] = {};
  if (!name || name.length > 200) fieldErrors.name = t("name");
  if (!email || !EMAIL_RE.test(email) || email.length > 320) {
    fieldErrors.email = t("email");
  }
  if (notes.length > 4000) fieldErrors.notes = t("notes");
  if (Object.keys(fieldErrors).length > 0) {
    return { status: "error", fieldErrors };
  }

  // Build absolute return URLs for PayPal redirect-fallback flow.
  const reqHeaders = await headers();
  const proto = reqHeaders.get("x-forwarded-proto") ?? "http";
  const host = reqHeaders.get("host") ?? "localhost:3000";
  const origin = `${proto}://${host}`;
  const localePrefix = locale === "en" ? "" : `/${locale}`;

  // Create local Order first, then create PayPal order keyed to it.
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
      returnUrl: `${origin}${localePrefix}/checkout/success?orderId=${order.id}`,
      cancelUrl: `${origin}${localePrefix}/checkout/cancel`,
    });

    await db.order.update({
      where: { id: order.id },
      data: { paypalOrderId: paypalOrder.id },
    });
  } catch (err) {
    // Mark the Order so we don't leak orphans, then surface a friendly error.
    await db.order.update({
      where: { id: order.id },
      data: { status: "FAILED" },
    });
    console.error("[booking] createOrder failed", err);
    return { status: "error", message: t("createOrder") };
  }

  // Hand off to the checkout page. redirect() throws internally; the line below is unreachable
  // but keeps TS satisfied since next-intl's redirect signature doesn't return `never`.
  redirect({ href: `/checkout/${order.id}`, locale });
  return { status: "idle" };
}
