import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  formatDuration,
  formatPrice,
  getActiveServices,
  getService,
} from "@/lib/services";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    getActiveServices().map((s) => ({ locale, slug: s.slug })),
  );
}

export async function generateMetadata(
  props: PageProps<"/[locale]/services/[slug]">,
): Promise<Metadata> {
  const { locale, slug } = await props.params;
  const service = getService(slug);
  if (!service) return {};
  const t = await getTranslations({ locale, namespace: "ServicesData" });
  return {
    title: t(`${slug}.title` as Parameters<typeof t>[0]),
    description: t(`${slug}.shortBlurb` as Parameters<typeof t>[0]),
  };
}

export default async function ServiceDetailPage(
  props: PageProps<"/[locale]/services/[slug]">,
) {
  const { locale, slug } = await props.params;
  setRequestLocale(locale);

  const service = getService(slug);
  if (!service) notFound();

  const t = await getTranslations("ServiceDetail");
  const data = await getTranslations("ServicesData");

  // raw() returns the raw JSON value, used for arrays (outcomes, description).
  const dataRaw = await getTranslations("ServicesData");
  const description = (dataRaw.raw(
    `${slug}.description` as Parameters<typeof dataRaw>[0],
  ) ?? []) as string[];
  const outcomes = (dataRaw.raw(
    `${slug}.outcomes` as Parameters<typeof dataRaw>[0],
  ) ?? []) as string[];

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
              {data(`${slug}.title` as Parameters<typeof data>[0])}
            </h1>
            <p className="mt-6 text-xl leading-relaxed text-muted">
              {data(`${slug}.shortBlurb` as Parameters<typeof data>[0])}
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
              <p className="mt-4 text-lg leading-relaxed">
                {data(`${slug}.forWhom` as Parameters<typeof data>[0])}
              </p>
            </div>
          </div>

          <aside className="lg:col-span-4">
            <div className="rounded-2xl border border-subtle bg-surface p-8 sticky top-24">
              <p className="eyebrow">{t("asideEyebrow")}</p>
              <dl className="mt-4 space-y-3 text-sm">
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
