"use client";

import { useActionState } from "react";
import { changePassword, type PasswordState } from "@/app/actions/auth";

const initial: PasswordState = {};

const inputClass =
  "mt-1 block w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]";

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, initial);

  return (
    <form action={action} className="max-w-sm space-y-4">
      <label className="block">
        <span className="text-sm font-medium">Current password</span>
        <input
          name="current"
          type="password"
          autoComplete="current-password"
          className={inputClass}
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">New password</span>
        <input
          name="next"
          type="password"
          autoComplete="new-password"
          className={inputClass}
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Confirm new password</span>
        <input
          name="confirm"
          type="password"
          autoComplete="new-password"
          className={inputClass}
        />
      </label>

      {state.error && (
        <p className="text-sm text-[var(--color-danger)]">{state.error}</p>
      )}
      {state.success && (
        <p className="text-sm text-[var(--color-success)]">Password updated.</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-60"
      >
        {pending ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
