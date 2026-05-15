/** Translatable service copy lives in messages/{locale}.json under ServicesData.{slug} */
export type ServiceShape = {
  slug: string;
  /** Duration in minutes for live sessions. Omit for async services. */
  durationMinutes?: number;
  /** Group capacity. Omit for 1:1 or async services. */
  capacity?: number;
  /** Delivery window in working days for async services, e.g. [3, 5]. */
  deliveryDays?: [number, number];
  priceCents: number;
  currency: "EUR";
};

export const services: ServiceShape[] = [
  {
    slug: "clarity-session",
    durationMinutes: 45,
    priceCents: 7900,
    currency: "EUR",
  },
  {
    slug: "restart-framework-workshop",
    durationMinutes: 120,
    priceCents: 6900,
    currency: "EUR",
  },
  // {
  //   slug: "interview-prep",
  //   durationMinutes: 90,
  //   priceCents: 22000,
  //   currency: "EUR",
  // },
  {
    slug: "cv-review",
    deliveryDays: [3, 5],
    priceCents: 9900,
    currency: "EUR",
  },
];

export function getService(slug: string): ServiceShape | undefined {
  return services.find((s) => s.slug === slug);
}

export function formatPrice(
  cents: number,
  currency: "EUR" = "EUR",
  locale = "en"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(cents / 100);
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
