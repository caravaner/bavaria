import { db } from "./client";
import type { Service, ServiceTranslation } from "./generated/prisma/client";

/** Default locale used when a service has no translation for the requested one. */
export const DEFAULT_LOCALE = "en";

/** Translatable copy for a single locale. */
export type ServiceContent = {
  title: string;
  shortBlurb: string;
  description: string[];
  outcomes: string[];
  forWhom: string[];
};

/** Public, JSON-serializable view of a service for one locale. This is exactly
 *  what the admin app's API returns and what the web app renders. */
export type ServiceDTO = {
  slug: string;
  active: boolean;
  durationMinutes: number | null;
  capacity: number | null;
  /** [from, to] working days, or null. */
  deliveryDays: [number, number] | null;
  eventDates: string[];
  eventTime: string | null;
  priceCents: number;
  currency: string;
  content: ServiceContent;
};

type ServiceWithTranslations = Service & { translations: ServiceTranslation[] };

function pickContent(
  service: ServiceWithTranslations,
  locale: string,
): ServiceContent {
  const t =
    service.translations.find((x) => x.locale === locale) ??
    service.translations.find((x) => x.locale === DEFAULT_LOCALE) ??
    service.translations[0];

  return {
    title: t?.title ?? service.slug,
    shortBlurb: t?.shortBlurb ?? "",
    description: t?.description ?? [],
    outcomes: t?.outcomes ?? [],
    forWhom: t?.forWhom ?? [],
  };
}

function toDTO(service: ServiceWithTranslations, locale: string): ServiceDTO {
  const deliveryDays =
    service.deliveryFrom != null && service.deliveryTo != null
      ? ([service.deliveryFrom, service.deliveryTo] as [number, number])
      : null;

  return {
    slug: service.slug,
    active: service.active,
    durationMinutes: service.durationMinutes,
    capacity: service.capacity,
    deliveryDays,
    eventDates: service.eventDates,
    eventTime: service.eventTime,
    priceCents: service.priceCents,
    currency: service.currency,
    content: pickContent(service, locale),
  };
}

/** Active services for public listings, ordered for display. */
export async function listServiceDTOs(
  locale: string = DEFAULT_LOCALE,
): Promise<ServiceDTO[]> {
  const services = await db.service.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: { translations: true },
  });
  return services.map((s) => toDTO(s, locale));
}

/** A single service as a DTO.
 *  @param activeOnly when true (default) an inactive service resolves to null. */
export async function getServiceDTO(
  slug: string,
  locale: string = DEFAULT_LOCALE,
  activeOnly = true,
): Promise<ServiceDTO | null> {
  const service = await db.service.findUnique({
    where: { slug },
    include: { translations: true },
  });
  if (!service) return null;
  if (activeOnly && !service.active) return null;
  return toDTO(service, locale);
}

// ---------------------------------------------------------------------------
// Admin CRUD — operates on the full record including every translation.
// ---------------------------------------------------------------------------

export type ServiceTranslationInput = {
  locale: string;
  title: string;
  shortBlurb: string;
  description: string[];
  outcomes: string[];
  forWhom: string[];
};

export type ServiceInput = {
  slug: string;
  active: boolean;
  sortOrder: number;
  durationMinutes: number | null;
  capacity: number | null;
  deliveryFrom: number | null;
  deliveryTo: number | null;
  eventDates: string[];
  eventTime: string | null;
  priceCents: number;
  currency: string;
  translations: ServiceTranslationInput[];
};

export type ServiceAdmin = ServiceWithTranslations;

export function listServicesAdmin(): Promise<ServiceAdmin[]> {
  return db.service.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: { translations: true },
  });
}

export function getServiceAdmin(id: string): Promise<ServiceAdmin | null> {
  return db.service.findUnique({
    where: { id },
    include: { translations: true },
  });
}

export function createService(input: ServiceInput): Promise<ServiceAdmin> {
  const { translations, ...scalars } = input;
  return db.service.create({
    data: {
      ...scalars,
      translations: { create: translations },
    },
    include: { translations: true },
  });
}

export async function updateService(
  id: string,
  input: ServiceInput,
): Promise<ServiceAdmin> {
  const { translations, ...scalars } = input;
  // Replace translations wholesale — simplest correct strategy for a small set.
  return db.$transaction(async (tx) => {
    await tx.serviceTranslation.deleteMany({ where: { serviceId: id } });
    return tx.service.update({
      where: { id },
      data: {
        ...scalars,
        translations: { create: translations },
      },
      include: { translations: true },
    });
  });
}

export function deleteService(id: string): Promise<Service> {
  return db.service.delete({ where: { id } });
}

export function setServiceActive(
  id: string,
  active: boolean,
): Promise<Service> {
  return db.service.update({ where: { id }, data: { active } });
}
