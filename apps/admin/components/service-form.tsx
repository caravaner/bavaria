"use client";

import { useActionState } from "react";
import { saveService, type ServiceFormState } from "@/app/actions/services";

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
          Pricing &amp; format
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
          <Text
            label="Duration (minutes)"
            name="durationMinutes"
            type="number"
            defaultValue={defaults.durationMinutes}
            hint="live sessions only"
          />
          <Text
            label="Capacity"
            name="capacity"
            type="number"
            defaultValue={defaults.capacity}
            hint="group services only"
          />
          <Text
            label="Delivery from (days)"
            name="deliveryFrom"
            type="number"
            defaultValue={defaults.deliveryFrom}
            hint="async services"
          />
          <Text
            label="Delivery to (days)"
            name="deliveryTo"
            type="number"
            defaultValue={defaults.deliveryTo}
          />
          <Text
            label="Event time"
            name="eventTime"
            defaultValue={defaults.eventTime}
            hint='e.g. "20:30 CEST"'
          />
        </div>
        <Area
          label="Event dates"
          name="eventDates"
          defaultValue={defaults.eventDates}
          hint="one YYYY-MM-DD per line"
          rows={2}
        />
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
