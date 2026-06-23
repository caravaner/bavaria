"use server";

import { revalidatePath } from "next/cache";
import { db } from "@bavaria/db";
import type { EmailPayload, Locale } from "@bavaria/email";
import { requireAdmin } from "@/lib/session";
import { sendAndLog, sendBookingReminder } from "@/lib/email";

export type EmailActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

/**
 * Resend an existing email by re-rendering it from its stored context (so it
 * picks up the latest template/branding). Always creates a fresh EmailMessage
 * row — no dedupeKey — so the resend is never swallowed.
 */
export async function resendEmail(
  _prev: EmailActionState,
  formData: FormData,
): Promise<EmailActionState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const original = await db.emailMessage.findUnique({ where: { id } });
  if (!original) {
    return { status: "error", message: "Email not found." };
  }

  // Rebuild the typed payload from the persisted template + context. The DB
  // stores context as opaque JSON, so we re-assert the template's shape here.
  const payload = {
    template: original.template,
    context: original.context,
  } as unknown as EmailPayload;

  const result = await sendAndLog({
    payload,
    to: original.toEmail,
    toName: original.toName,
    locale: (original.locale as Locale) ?? "en",
    orderId: original.orderId,
  });

  revalidatePath("/emails");
  revalidatePath(`/emails/${id}`);

  if (!result.ok) {
    return { status: "error", message: result.error };
  }
  return { status: "success", message: "Email resent." };
}

/**
 * Send a manual reminder for the booking linked to an email. Triggered from the
 * email detail page; sends immediately (no scheduling in this cut).
 */
export async function sendReminder(
  _prev: EmailActionState,
  formData: FormData,
): Promise<EmailActionState> {
  await requireAdmin();

  const orderId = String(formData.get("orderId") ?? "");
  const customMessage = String(formData.get("customMessage") ?? "").trim();

  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) {
    return { status: "error", message: "Linked booking not found." };
  }

  const result = await sendBookingReminder(order, {
    customMessage: customMessage || null,
  });

  revalidatePath("/emails");
  revalidatePath(`/orders/${orderId}`);

  if (!result.ok) {
    return { status: "error", message: result.error };
  }
  return { status: "success", message: "Reminder sent." };
}
