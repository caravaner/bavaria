import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  formatDuration,
  formatEventDates,
  formatPrice,
  getService,
} from "@/lib/services";

// Service data comes from the admin API at request time.
export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/[locale]/services/[slug]">,
): Promise<Metadata> {
  const { locale, slug } = await props.params;
  const service = await getService(slug, locale);
  if (!service) return {};
  return {
    title: service.content.title,
    description: service.content.shortBlurb,
  };
}

export default async function ServiceDetailPage(
  props: PageProps<"/[locale]/services/[slug]">,
) {
  const { locale, slug } = await props.params;
  setRequestLocale(locale);

  const service = await getService(slug, locale);
  if (!service) notFound();

  const t = await getTranslations("ServiceDetail");
  const { title, shortBlurb, description, outcomes, forWhom } = service.content;

  return (
    <>
      <section className="container-page pt-20 pb-16 sm:pt-28">
        <Link
          href="/services"
          className="text-sm text-muted hover:text-foreground transition-colors"
        >
          {t("backLink")}
        </Link>
        <div className="mt-8 grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-8">
            <p className="eyebrow">{t("eyebrow")}</p>
            <h1 className="heading-display mt-4 text-5xl sm:text-6xl">
              {title}
            </h1>
            <p className="mt-6 text-xl leading-relaxed text-muted">
              {shortBlurb}
            </p>
            <div className="mt-12 space-y-6 text-lg leading-relaxed">
              {description.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>

            {outcomes.length > 0 && (
              <div className="mt-16">
                <p className="eyebrow">{t("outcomesHeading")}</p>
                <ul className="mt-4 space-y-3">
                  {outcomes.map((o, i) => (
                    <li key={i} className="flex gap-4 text-lg">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      <span>{o}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-16">
              <p className="eyebrow">{t("forWhomHeading")}</p>
              <div className="mt-4 space-y-4 text-lg leading-relaxed">
                {forWhom.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>
          </div>

          <aside className="lg:col-span-4">
            <div className="rounded-2xl border border-subtle bg-surface p-8 sticky top-24">
              <p className="eyebrow">{t("asideEyebrow")}</p>
              <dl className="mt-4 space-y-3 text-sm">
                {service.eventDates.length > 0 && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">{t("dates")}</dt>
                    <dd className="text-right">
                      {formatEventDates(service.eventDates, locale)}
                    </dd>
                  </div>
                )}
                {service.eventTime && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">{t("time")}</dt>
                    <dd className="text-right">{service.eventTime}</dd>
                  </div>
                )}
                {service.durationMinutes && (
                  <div className="flex justify-between">
                    <dt className="text-muted">{t("duration")}</dt>
                    <dd>{formatDuration(service.durationMinutes, locale)}</dd>
                  </div>
                )}
                {service.capacity && (
                  <div className="flex justify-between">
                    <dt className="text-muted">{t("capacity")}</dt>
                    <dd>{t("capacityValue", { n: service.capacity })}</dd>
                  </div>
                )}
                {service.deliveryDays && (
                  <div className="flex justify-between">
                    <dt className="text-muted">{t("delivery")}</dt>
                    <dd>
                      {t("deliveryValue", {
                        from: service.deliveryDays[0],
                        to: service.deliveryDays[1],
                      })}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between border-t border-subtle pt-3">
                  <dt className="text-muted">{t("price")}</dt>
                  <dd className="text-lg font-medium">
                    {formatPrice(service.priceCents, service.currency, locale)}
                  </dd>
                </div>
              </dl>
              <Link
                href={`/services/${slug}/book`}
                className="mt-6 flex items-center justify-center rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background hover:bg-accent hover:text-foreground transition-colors"
              >
                {t("bookCta")}
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
