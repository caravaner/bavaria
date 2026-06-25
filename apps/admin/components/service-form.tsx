"use client";

import { useActionState, useState } from "react";
import { saveService, type ServiceFormState } from "@/app/actions/services";

/** The three mutually-exclusive ways a service is delivered. */
type ServiceMode = "oneToOne" | "event" | "async";

const MODES: { key: ServiceMode; label: string; hint: string }[] = [
  {
    key: "oneToOne",
    label: "Live 1:1 session",
    hint: "A scheduled one-on-one call of a fixed length. The guest picks a time when booking.",
  },
  {
    key: "event",
    label: "Scheduled event",
    hint: "A workshop or cohort on fixed dates with a limited number of seats.",
  },
  {
    key: "async",
    label: "Async delivery",
    hint: "A deliverable (e.g. a CV review) returned within a working-day window.",
  },
];

/** Infer which mode an existing service belongs to from its populated fields. */
function deriveMode(d: ServiceFormValues): ServiceMode {
  if (d.eventDates.trim() || d.eventTime.trim()) return "event";
  if (d.deliveryFrom.trim() || d.deliveryTo.trim()) return "async";
  return "oneToOne";
}

export type ServiceFormValues = {
  id?: string;
  slug: string;
  active: boolean;
  sortOrder: number;
  durationMinutes: string;
  capacity: string;
  deliveryFrom: string;
  deliveryTo: string;
  eventDates: string; // newline-separated
  eventTime: string;
  priceEuros: string;
  currency: string;
  title: string;
  shortBlurb: string;
  description: string; // newline-separated paragraphs
  outcomes: string; // newline-separated
  forWhom: string; // newline-separated
};

const initial: ServiceFormState = {};

const inputClass =
  "mt-1 block w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]";

function Text({
  label,
  name,
  defaultValue,
  hint,
  ...rest
}: {
  label: string;
  name: string;
  defaultValue?: string;
  hint?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      {hint && <span className="ml-2 text-xs text-[var(--color-muted)]">{hint}</span>}
      <input name={name} defaultValue={defaultValue} className={inputClass} {...rest} />
    </label>
  );
}

function Area({
  label,
  name,
  defaultValue,
  hint,
  rows = 4,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  hint?: string;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      {hint && <span className="ml-2 text-xs text-[var(--color-muted)]">{hint}</span>}
      <textarea
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        className={inputClass}
      />
    </label>
  );
}

export function ServiceForm({ defaults }: { defaults: ServiceFormValues }) {
  const [state, action, pending] = useActionState(saveService, initial);
  const [mode, setMode] = useState<ServiceMode>(() => deriveMode(defaults));
  const activeMode = MODES.find((m) => m.key === mode)!;

  return (
    <form action={action} className="space-y-8">
      {defaults.id && <input type="hidden" name="id" value={defaults.id} />}

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          Basics
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Text
            label="Slug"
            name="slug"
            defaultValue={defaults.slug}
            hint="lowercase-with-hyphens"
            required
          />
          <Text
            label="Sort order"
            name="sortOrder"
            type="number"
            defaultValue={defaults.sortOrder.toString()}
          />
        </div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="active"
            defaultChecked={defaults.active}
            className="h-4 w-4"
          />
          <span className="text-sm font-medium">Active (visible on the site)</span>
        </label>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          Pricing
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Text
            label="Price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            defaultValue={defaults.priceEuros}
            hint="major units, e.g. 79.00"
            required
          />
          <Text label="Currency" name="currency" defaultValue={defaults.currency} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          Format
        </h2>

        {/* Mode picker — only the chosen mode's fields are submitted, so the
            others are cleared on save. */}
        <div role="radiogroup" className="grid gap-2 sm:grid-cols-3">
          {MODES.map((m) => {
            const selected = m.key === mode;
            return (
              <button
                key={m.key}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setMode(m.key)}
                className={[
                  "rounded-lg border px-3 py-2 text-left text-sm font-medium",
                  selected
                    ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
                    : "border-[var(--color-border)] text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-foreground)]",
                ].join(" ")}
              >
                {m.label}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-[var(--color-muted)]">{activeMode.hint}</p>

        {mode === "oneToOne" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Text
              label="Duration (minutes)"
              name="durationMinutes"
              type="number"
              defaultValue={defaults.durationMinutes}
              hint="length of the session"
            />
          </div>
        )}

        {mode === "event" && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Text
                label="Event time"
                name="eventTime"
                defaultValue={defaults.eventTime}
                hint='e.g. "20:30 CEST"'
              />
              <Text
                label="Capacity"
                name="capacity"
                type="number"
                defaultValue={defaults.capacity}
                hint="max seats"
              />
            </div>
            <Area
              label="Event dates"
              name="eventDates"
              defaultValue={defaults.eventDates}
              hint="one YYYY-MM-DD per line"
              rows={3}
            />
          </div>
        )}

        {mode === "async" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Text
              label="Delivery from (working days)"
              name="deliveryFrom"
              type="number"
              defaultValue={defaults.deliveryFrom}
            />
            <Text
              label="Delivery to (working days)"
              name="deliveryTo"
              type="number"
              defaultValue={defaults.deliveryTo}
            />
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          Copy (English)
        </h2>
        <Text label="Title" name="title" defaultValue={defaults.title} required />
        <Area
          label="Short blurb"
          name="shortBlurb"
          defaultValue={defaults.shortBlurb}
          rows={2}
        />
        <Area
          label="Description"
          name="description"
          defaultValue={defaults.description}
          hint="one paragraph per line"
          rows={5}
        />
        <Area
          label="Outcomes"
          name="outcomes"
          defaultValue={defaults.outcomes}
          hint="one per line"
        />
        <Area
          label="Who it's for"
          name="forWhom"
          defaultValue={defaults.forWhom}
          hint="one per line"
        />
      </section>

      {state.error && (
        <p className="text-sm text-[var(--color-danger)]">{state.error}</p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save service"}
        </button>
      </div>
    </form>
  );
}
