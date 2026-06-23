"use server";

import { getTranslations } from "next-intl/server";
import { sendContactMessage } from "./contact";

export type ContactFormState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function submitContactForm(
  _prev: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const t = await getTranslations("Contact.form");

  // Honeypot — bots fill hidden fields
  if (formData.get("website")) {
    return { status: "success", message: t("successBody") };
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!name || name.length > 200) {
    return { status: "error", message: t("errors.name") };
  }
  if (
    !email ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    email.length > 320
  ) {
    return { status: "error", message: t("errors.email") };
  }
  if (!message || message.length < 10 || message.length > 4000) {
    return { status: "error", message: t("errors.message") };
  }

  // Notify the owner via the admin API (which logs it and sends the email).
  const { ok } = await sendContactMessage({ name, email, message });
  if (!ok) {
    return { status: "error", message: t("errors.submit") };
  }

  return { status: "success", message: t("successBody") };
}
