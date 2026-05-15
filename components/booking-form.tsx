"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import {
  submitBooking,
  type BookingFormState,
} from "@/app/[locale]/services/[slug]/book/action";

const initialState: BookingFormState = { status: "idle" };

export function BookingForm({ slug }: { slug: string }) {
  const t = useTranslations("Booking.form");
  const [state, formAction, pending] = useActionState(
    submitBooking,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="slug" value={slug} />

      {/* Honeypot */}
      <div aria-hidden className="hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <Field
        label={t("name")}
        name="name"
        type="text"
        required
        maxLength={200}
        error={state.fieldErrors?.name}
      />
      <Field
        label={t("email")}
        name="email"
        type="email"
        required
        maxLength={320}
        error={state.fieldErrors?.email}
      />
      <Field
        label={t("notes")}
        name="notes"
        as="textarea"
        rows={5}
        maxLength={4000}
        error={state.fieldErrors?.notes}
      />

      {state.status === "error" && state.message && (
        <p className="text-sm text-accent">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background hover:bg-accent hover:text-foreground transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {pending ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  as,
  error,
  ...rest
}: {
  label: string;
  name: string;
  as?: "textarea";
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement> &
  React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const baseClass = `mt-2 block w-full rounded-xl border bg-surface px-4 py-3 text-foreground placeholder:text-muted focus:outline-none focus:ring-1 ${
    error
      ? "border-accent focus:border-accent focus:ring-accent/40"
      : "border-subtle focus:border-foreground focus:ring-foreground/20"
  }`;
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      {as === "textarea" ? (
        <textarea name={name} className={baseClass} {...rest} />
      ) : (
        <input name={name} className={baseClass} {...rest} />
      )}
      {error && <span className="mt-1 text-xs text-accent block">{error}</span>}
    </label>
  );
}
