import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  type ServiceShape,
  formatDuration,
  formatPrice,
} from "@/lib/services";

export function ServiceCard({
  service,
  showPrice = true,
}: {
  service: ServiceShape;
  showPrice?: boolean;
}) {
  const locale = useLocale();
  const t = useTranslations("ServicesData");
  const cardT = useTranslations("Services.card");
  const detailT = useTranslations("ServiceDetail");

  const title = t(`${service.slug}.title` as Parameters<typeof t>[0]);
  const shortBlurb = t(
    `${service.slug}.shortBlurb` as Parameters<typeof t>[0],
  );

  const meta: string[] = [];
  if (service.durationMinutes) {
    meta.push(formatDuration(service.durationMinutes, locale));
  }
  if (service.capacity) {
    meta.push(detailT("capacityValue", { n: service.capacity }));
  }
  if (service.deliveryDays) {
    meta.push(
      detailT("deliveryValue", {
        from: service.deliveryDays[0],
        to: service.deliveryDays[1],
      }),
    );
  }

  return (
    <Link
      href={`/services/${service.slug}`}
      className="group relative flex flex-col rounded-2xl border border-subtle bg-surface p-6 transition-all hover:-translate-y-0.5 hover:border-foreground/40 hover:shadow-[0_8px_24px_-12px_rgba(28,61,43,0.18)]"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="heading-display text-2xl">{title}</h3>
        {meta.length > 0 && (
          <span className="shrink-0 text-xs text-muted text-right">
            {meta.join(" · ")}
          </span>
        )}
      </div>
      <p className="mt-4 text-sm leading-relaxed text-muted flex-1">
        {shortBlurb}
      </p>
      <div
        className={`mt-6 flex items-end ${showPrice ? "justify-between" : "justify-end"}`}
      >
        {showPrice && (
          <span className="text-lg font-medium">
            {formatPrice(service.priceCents, service.currency, locale)}
          </span>
        )}
        <span className="text-sm text-muted group-hover:text-accent transition-colors">
          {cardT("learnMore")}
        </span>
      </div>
    </Link>
  );
}
