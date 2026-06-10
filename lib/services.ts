/** Translatable service copy lives in messages/{locale}.json under ServicesData.{slug} */
export type ServiceShape = {
  slug: string;
  /** Permanent on/off in code. Inactive services 404 and are filtered from listings. */
  active: boolean;
  /** Duration in minutes for live sessions. Omit for async services. */
  durationMinutes?: number;
  /** Group capacity. Omit for 1:1 or async services. */
  capacity?: number;
  /** Delivery window in working days for async services, e.g. [3, 5]. */
  deliveryDays?: [number, number];
  /** Fixed-schedule events (workshops, cohorts). ISO dates "YYYY-MM-DD". */
  eventDates?: string[];
  /** Free-form start time for display, e.g. "20:30 CEST". Shown on a separate row. */
  eventTime?: string;
  priceCents: number;
  currency: "EUR";
};

export const services: ServiceShape[] = [
  {
    slug: "clarity-session",
    active: true,
    durationMinutes: 45,
    priceCents: 7900,
    currency: "EUR",
  },
  {
    slug: "restart-framework-workshop",
    active: true,
    durationMinutes: 90,
    eventDates: ["2026-07-14", "2026-07-16"],
    eventTime: "20:30 CEST",
    priceCents: 6900,
    currency: "EUR",
  },
  // {
  //   slug: "interview-prep",
  //   active: true,
  //   durationMinutes: 90,
  //   priceCents: 22000,
  //   currency: "EUR",
  // },
  {
    slug: "cv-review",
    active: true,
    deliveryDays: [3, 5],
    priceCents: 9900,
    currency: "EUR",
  },
  // Production payment smoke test — keep listed in DISABLED_SERVICES in prod env
  // until you're actively running an end-to-end test, then remove it to enable.
  {
    slug: "test-50",
    active: true,
    durationMinutes: 15,
    priceCents: 50,
    currency: "EUR",
  },
];

// Runtime override: comma-separated slugs in DISABLED_SERVICES are forced off.
// Read at module load — env changes on Vercel trigger redeploy + cold start, which is enough.
const disabledFromEnv = new Set(
  (process.env.DISABLED_SERVICES ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
);

function isEnabled(s: ServiceShape): boolean {
  return s.active && !disabledFromEnv.has(s.slug);
}

/** Services visible to end users. Use this for listings, home page, sitemap, etc. */
export function getActiveServices(): ServiceShape[] {
  return services.filter(isEnabled);
}

/** Returns a service only if it is currently enabled. Inactive → undefined → caller 404s.
 *  Use for new-booking paths (detail page, booking page, booking action). */
export function getService(slug: string): ServiceShape | undefined {
  return services.find((s) => s.slug === slug && isEnabled(s));
}

/** Returns a service regardless of active state. Use for paths that operate on
 *  already-created orders (checkout, capture), so deactivating a service mid-flight
 *  doesn't reject otherwise-valid payments. */
export function findService(slug: string): ServiceShape | undefined {
  return services.find((s) => s.slug === slug);
}

export function formatPrice(
  cents: number,
  currency: "EUR" = "EUR",
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
