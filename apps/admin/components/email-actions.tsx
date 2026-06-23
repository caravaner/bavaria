"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { RefreshCw, Send } from "lucide-react";
import {
  resendEmail,
  sendReminder,
  type EmailActionState,
} from "@/app/actions/emails";

const initial: EmailActionState = { status: "idle" };

function Feedback({ state }: { state: EmailActionState }) {
  if (state.status === "idle") return null;
  const tone =
    state.status === "success"
      ? "text-[var(--color-success)]"
      : "text-[var(--color-danger)]";
  return <p className={`mt-2 text-sm ${tone}`}>{state.message}</p>;
}

function SubmitButton({
  children,
  variant = "primary",
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}) {
  const { pending } = useFormStatus();
  const base =
    "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-60";
  const styles =
    variant === "primary"
      ? "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)]"
      : "border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)]";
  return (
    <button type="submit" disabled={pending} className={`${base} ${styles}`}>
      {children}
    </button>
  );
}

export function ResendButton({ id }: { id: string }) {
  const [state, action] = useActionState(resendEmail, initial);
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <SubmitButton variant="secondary">
        <RefreshCw size={16} strokeWidth={2} />
        Resend
      </SubmitButton>
      <Feedback state={state} />
    </form>
  );
}

export function ReminderForm({ orderId }: { orderId: string }) {
  const [state, action] = useActionState(sendReminder, initial);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="orderId" value={orderId} />
      <label className="block">
        <span className="text-sm font-medium">Reminder message</span>
        <span className="ml-2 text-xs text-[var(--color-muted)]">optional</span>
        <textarea
          name="customMessage"
          rows={3}
          placeholder="Add a note to include in the reminder…"
          className="mt-1 block w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
        />
      </label>
      <SubmitButton variant="primary">
        <Send size={16} strokeWidth={2} />
        Send reminder
      </SubmitButton>
      <Feedback state={state} />
    </form>
  );
}
