import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BookingForm } from "@/components/booking-form";
import {
  formatDuration,
  formatPrice,
  getService,
} from "@/lib/services";

export async function generateMetadata(
  props: PageProps<"/[locale]/services/[slug]/book">,
): Promise<Metadata> {
  const { locale, slug } = await props.params;
  const service = getService(slug);
  if (!service) return {};
  const t = await getTranslations({ locale, namespace: "Booking" });
  const data = await getTranslations({ locale, namespace: "ServicesData" });
  const title = data(`${slug}.title` as Parameters<typeof data>[0]);
  return {
    title: t("metaTitle", { service: title }),
    description: t("metaDescription", { service: title }),
    robots: { index: false, follow: false },
  };
}

export default async function BookingPage(
  props: PageProps<"/[locale]/services/[slug]/book">,
) {
  const { locale, slug } = await props.params;
  setRequestLocale(locale);

  const service = getService(slug);
  if (!service) notFound();

  const t = await getTranslations("Booking");
  const data = await getTranslations("ServicesData");
  const detail = await getTranslations("ServiceDetail");
  const title = data(`${slug}.title` as Parameters<typeof data>[0]);
  const blurb = data(`${slug}.shortBlurb` as Parameters<typeof data>[0]);

  return (
    <section className="container-page pt-20 pb-24 sm:pt-28">
      <Link
        href={`/services/${slug}`}
        className="text-sm text-muted hover:text-foreground transition-colors"
      >
        {detail("backLink")}
      </Link>

      <div className="mt-8 grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <p className="eyebrow">{t("eyebrow")}</p>
          <h1 className="heading-display mt-4 text-4xl sm:text-5xl">
            {t("headingPrefix")} {title}
          </h1>
          <p className="mt-6 text-base leading-relaxed text-muted">
            {t("intro")}
          </p>

          <div className="mt-10 rounded-2xl border border-subtle bg-surface p-6">
            <p className="eyebrow">{t("summaryEyebrow")}</p>
            <p className="heading-display mt-3 text-2xl">{title}</p>
            <p className="mt-2 text-sm text-muted">{blurb}</p>

            <dl className="mt-5 space-y-2 text-sm">
              {service.durationMinutes && (
                <div className="flex justify-between">
                  <dt className="text-muted">{detail("duration")}</dt>
                  <dd>{formatDuration(service.durationMinutes, locale)}</dd>
                </div>
              )}
              {service.deliveryDays && (
                <div className="flex justify-between">
                  <dt className="text-muted">{detail("delivery")}</dt>
                  <dd>
                    {detail("deliveryValue", {
                      from: service.deliveryDays[0],
                      to: service.deliveryDays[1],
                    })}
                  </dd>
                </div>
              )}
              <div className="flex justify-between border-t border-subtle pt-3">
                <dt className="text-muted">{t("summaryTotal")}</dt>
                <dd className="text-lg font-medium">
                  {formatPrice(service.priceCents, service.currency, locale)}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="lg:col-span-7">
          <BookingForm slug={slug} />
        </div>
      </div>
    </section>
  );
}
