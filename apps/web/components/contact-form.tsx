"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import {
  submitContactForm,
  type ContactFormState,
} from "@/lib/contact-action";

const initialState: ContactFormState = { status: "idle" };

export function ContactForm() {
  const t = useTranslations("Contact.form");
  const [state, formAction, pending] = useActionState(
    submitContactForm,
    initialState,
  );

  if (state.status === "success") {
    return (
      <div className="rounded-2xl border border-accent/40 bg-accent-soft/50 p-8">
        <p className="heading-display text-2xl">{t("successHeading")}</p>
        <p className="mt-3 text-muted">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      {/* Honeypot — hidden from users, attractive to bots */}
      <div aria-hidden className="hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <Field label={t("name")} name="name" type="text" required maxLength={200} />
      <Field label={t("email")} name="email" type="email" required maxLength={320} />
      <Field
        label={t("message")}
        name="message"
        as="textarea"
        required
        rows={6}
        maxLength={4000}
      />

      {state.status === "error" && (
        <p className="text-sm text-accent">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background hover:bg-accent hover:text-foreground transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {pending ? t("sending") : t("submit")}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  as,
  ...rest
}: {
  label: string;
  name: string;
  as?: "textarea";
} & React.InputHTMLAttributes<HTMLInputElement> &
  React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const baseClass =
    "mt-2 block w-full rounded-xl border border-subtle bg-surface px-4 py-3 text-foreground placeholder:text-muted focus:border-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20";
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      {as === "textarea" ? (
        <textarea name={name} className={baseClass} {...rest} />
      ) : (
        <input name={name} className={baseClass} {...rest} />
      )}
    </label>
  );
}
