import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ServiceCard } from "@/components/service-card";
import { TestimonialCard } from "@/components/testimonial-card";
import { getActiveServices } from "@/lib/services";

export default async function Home(props: PageProps<"/[locale]">) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  const t = await getTranslations("Home");
  const tT = await getTranslations("Testimonials");

  const testimonialKeys = ["miriam", "hannah", "patricia"] as const;

  return (
    <>
      {/* Hero */}
      <section className="container-page pt-20 pb-24 sm:pt-28 sm:pb-32">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16 items-center">
          <div className="lg:col-span-7">
            <p className="eyebrow">{t("eyebrow")}</p>
            <h1 className="heading-display mt-5 text-5xl sm:text-6xl lg:text-7xl">
              {t("headlineBefore")}{" "}
              <span className="text-accent italic">
                {t("headlineFirstAccent")}
              </span>{" "}
              {t("headlineMiddle")}{" "}
              <span className="text-accent italic">
                {t("headlineSecondAccent")}
              </span>
              .
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted">
              {t("subhead")}
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background hover:bg-accent hover:text-foreground transition-colors"
              >
                {t("primaryCta")}
              </Link>
              <Link
                href="/services"
                className="inline-flex items-center rounded-full border border-foreground/20 px-6 py-3 text-sm font-medium hover:border-foreground/50 transition-colors"
              >
                {t("secondaryCta")}
              </Link>
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-accent-soft">
              <Image
                src="/images/site.jpg"
                alt={t("heroImageAlt")}
                fill
                priority
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* About preview */}
      <section className="border-y border-subtle bg-surface">
        <div className="container-page py-20 sm:py-24 grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="eyebrow">{t("aboutEyebrow")}</p>
            <h2 className="heading-display mt-4 text-4xl sm:text-5xl">
              {t("aboutHeading")}
            </h2>
          </div>
          <div className="lg:col-span-8 lg:pl-8">
            <p className="text-lg leading-relaxed">
              {(await getTranslations("Author"))("shortBio")}
            </p>
            <p className="mt-6 leading-relaxed text-muted">
              {(await getTranslations("Author"))("bio.p3")}
            </p>
            <Link
              href="/about"
              className="mt-8 inline-flex items-center text-sm font-medium hover:text-accent transition-colors"
            >
              {t("aboutReadMore")}
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container-page py-24 sm:py-32">
        <div className="max-w-2xl mb-12">
          <p className="eyebrow">{t("testimonialsEyebrow")}</p>
          <h2 className="heading-display mt-3 text-4xl sm:text-5xl">
            {t("testimonialsHeading")}
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {testimonialKeys.map((key) => (
            <TestimonialCard
              key={key}
              name={tT(`${key}.name`)}
              context={tT(`${key}.context`)}
              body={tT(`${key}.body`)}
            />
          ))}
        </div>
      </section>

      {/* Services */}
      <section className="border-t border-subtle bg-surface">
        <div className="container-page py-24 sm:py-32">
          <div className="flex items-end justify-between flex-wrap gap-4 mb-12">
            <div>
              <p className="eyebrow">{t("servicesEyebrow")}</p>
              <h2 className="heading-display mt-3 text-4xl sm:text-5xl">
                {t("servicesHeading")}
              </h2>
            </div>
            <Link
              href="/services"
              className="text-sm font-medium hover:text-accent transition-colors"
            >
              {t("servicesViewAll")}
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {getActiveServices().map((s) => (
              <ServiceCard key={s.slug} service={s} showPrice={false} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-page py-24 sm:py-32">
        <div className="rounded-3xl bg-foreground text-background p-12 sm:p-16 lg:p-20 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-accent/30 blur-3xl pointer-events-none" />
          <div className="relative">
            <p className="eyebrow text-accent">{t("ctaEyebrow")}</p>
            <h2 className="heading-display mt-4 text-4xl sm:text-5xl max-w-3xl">
              {t("ctaHeading")}
            </h2>
            <p className="mt-6 max-w-xl text-background/80 text-lg leading-relaxed">
              {t("ctaFollow")}
            </p>
            <Link
              href="/contact"
              className="mt-10 inline-flex items-center rounded-full bg-accent px-6 py-3 text-sm font-medium text-foreground hover:bg-accent-soft transition-colors"
            >
              {t("ctaButton")}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
