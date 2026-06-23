/**
 * Service data access for the web app — backed entirely by the admin app's HTTP
 * API (no database here). The function names mirror the old in-process helpers
 * so callers barely change; they're now async and take a locale.
 */

import { apiBaseUrl, internalSecretHeader } from "./api";

/** Translatable copy for a single locale (mirrors the API's ServiceDTO.content). */
export type ServiceContent = {
  title: string;
  shortBlurb: string;
  description: string[];
  outcomes: string[];
  forWhom: string[];
};

/** A service as returned by the admin API. */
export type ServiceDTO = {
  slug: string;
  active: boolean;
  durationMinutes: number | null;
  capacity: number | null;
  deliveryDays: [number, number] | null;
  eventDates: string[];
  eventTime: string | null;
  priceCents: number;
  currency: string;
  content: ServiceContent;
};

/** Active services for listings (home, services index). */
export async function getActiveServices(locale = "en"): Promise<ServiceDTO[]> {
  try {
    const res = await fetch(
      `${apiBaseUrl()}/api/services?locale=${encodeURIComponent(locale)}`,
      { next: { revalidate: 60 } },
    );
    if (!res.ok) {
      console.error("[web] getActiveServices failed", res.status);
      return [];
    }
    const data = (await res.json()) as { services: ServiceDTO[] };
    return data.services;
  } catch (err) {
    console.error("[web] getActiveServices error", err);
    return [];
  }
}

/** A single active service, or null. Use for new-booking paths (detail, booking). */
export async function getService(
  slug: string,
  locale = "en",
): Promise<ServiceDTO | null> {
  try {
    const res = await fetch(
      `${apiBaseUrl()}/api/services/${encodeURIComponent(slug)}?locale=${encodeURIComponent(locale)}`,
      { next: { revalidate: 60 } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { service: ServiceDTO };
    return data.service;
  } catch (err) {
    console.error("[web] getService error", err);
    return null;
  }
}

/** A service regardless of active state. Use for already-created orders
 *  (checkout, capture) so deactivating mid-flight doesn't break valid payments. */
export async function findService(
  slug: string,
  locale = "en",
): Promise<ServiceDTO | null> {
  try {
    const res = await fetch(
      `${apiBaseUrl()}/api/services/${encodeURIComponent(slug)}?locale=${encodeURIComponent(locale)}&includeInactive=1`,
      { headers: internalSecretHeader(), cache: "no-store" },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { service: ServiceDTO };
    return data.service;
  } catch (err) {
    console.error("[web] findService error", err);
    return null;
  }
}

// ─── Formatting helpers (pure, presentation only) ────────────────────────────

export function formatPrice(
  cents: number,
  currency = "EUR",
  locale = "en",
): string {
  const hasCents = cents % 100 !== 0;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: hasCents ? 2 : 0,
  }).format(cents / 100);
}

/** Formats ISO date strings for display. Collapses same-month entries:
 *   ["2026-07-14", "2026-07-16"]                → "14 & 16 July 2026"
 *   ["2026-07-14", "2026-08-02"]                → "14 July & 2 August 2026" */
export function formatEventDates(dates: string[], locale = "en"): string {
  if (dates.length === 0) return "";
  const parsed = dates.map((d) => new Date(d));

  const dayFmt = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    timeZone: "UTC",
  });
  const monthYearFmt = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const fullDateFmt = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  const sameMonthYear = parsed.every(
    (d) => monthYearFmt.format(d) === monthYearFmt.format(parsed[0]),
  );
  return sameMonthYear
    ? `${parsed.map((d) => dayFmt.format(d)).join(" & ")} ${monthYearFmt.format(parsed[0])}`
    : parsed.map((d) => fullDateFmt.format(d)).join(" & ");
}

export function formatDuration(minutes: number, locale = "en"): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = minutes / 60;
  if (Number.isInteger(hours)) {
    const fmt = new Intl.NumberFormat(locale).format(hours);
    return locale.startsWith("en")
      ? `${fmt} hr${hours === 1 ? "" : "s"}`
      : `${fmt} h`;
  }
  return `${Math.floor(hours)} hr ${minutes % 60} min`;
}
