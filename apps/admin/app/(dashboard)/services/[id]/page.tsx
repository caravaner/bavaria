import Link from "next/link";
import { notFound } from "next/navigation";
import { getServiceAdmin, DEFAULT_LOCALE } from "@bavaria/db";
import { ServiceForm, type ServiceFormValues } from "@/components/service-form";
import { removeService } from "@/app/actions/services";

export const dynamic = "force-dynamic";

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const service = await getServiceAdmin(id);
  if (!service) notFound();

  const en =
    service.translations.find((t) => t.locale === DEFAULT_LOCALE) ??
    service.translations[0];

  const defaults: ServiceFormValues = {
    id: service.id,
    slug: service.slug,
    active: service.active,
    sortOrder: service.sortOrder,
    durationMinutes: service.durationMinutes?.toString() ?? "",
    capacity: service.capacity?.toString() ?? "",
    deliveryFrom: service.deliveryFrom?.toString() ?? "",
    deliveryTo: service.deliveryTo?.toString() ?? "",
    eventDates: service.eventDates.join("\n"),
    eventTime: service.eventTime ?? "",
    priceEuros: (service.priceCents / 100).toString(),
    currency: service.currency,
    title: en?.title ?? "",
    shortBlurb: en?.shortBlurb ?? "",
    description: (en?.description ?? []).join("\n"),
    outcomes: (en?.outcomes ?? []).join("\n"),
    forWhom: (en?.forWhom ?? []).join("\n"),
  };

  return (
    <div className="max-w-2xl">
      <Link
        href="/services"
        className="text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
      >
        ← Services
      </Link>
      <h1 className="mt-3 text-2xl font-semibold">Edit service</h1>

      <div className="mt-6">
        <ServiceForm defaults={defaults} />
      </div>

      <div className="mt-10 border-t border-[var(--color-border)] pt-6">
        <form action={removeService}>
          <input type="hidden" name="id" value={service.id} />
          <button
            type="submit"
            className="rounded-lg border border-[var(--color-danger)] px-4 py-2 text-sm font-medium text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]"
          >
            Delete service
          </button>
        </form>
      </div>
    </div>
  );
}
