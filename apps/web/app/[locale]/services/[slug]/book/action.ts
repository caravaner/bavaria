"use server";

import { headers } from "next/headers";
import { redirect } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { createBookingOrder } from "@/lib/orders";
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

  // Server-authoritative service lookup (price is validated again in the API).
  const service = await getService(slug, locale);
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

  // Build absolute return URLs for PayPal's redirect-fallback flow. The admin
  // API substitutes the order id into the template once the order is created.
  const reqHeaders = await headers();
  const proto = reqHeaders.get("x-forwarded-proto") ?? "http";
  const host = reqHeaders.get("host") ?? "localhost:3000";
  const origin = `${proto}://${host}`;
  const localePrefix = locale === "en" ? "" : `/${locale}`;

  const result = await createBookingOrder({
    slug: service.slug,
    name,
    email,
    notes,
    locale,
    returnUrlTemplate: `${origin}${localePrefix}/checkout/success?orderId=__ORDER_ID__`,
    cancelUrl: `${origin}${localePrefix}/checkout/cancel`,
  });

  if (!result.ok) {
    console.error("[booking] createBookingOrder failed", result.error);
    return { status: "error", message: t("createOrder") };
  }

  // Hand off to the checkout page. redirect() throws internally; the line below is unreachable
  // but keeps TS satisfied since next-intl's redirect signature doesn't return `never`.
  redirect({ href: `/checkout/${result.orderId}`, locale });
  return { status: "idle" };
}
