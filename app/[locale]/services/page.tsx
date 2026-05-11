import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ServiceCard } from "@/components/service-card";
import { services } from "@/lib/services";

export async function generateMetadata(
  props: PageProps<"/[locale]/services">,
): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "Services" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function ServicesPage(
  props: PageProps<"/[locale]/services">,
) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  const t = await getTranslations("Services");

  return (
    <>
      <section className="container-page pt-20 pb-12 sm:pt-28">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1 className="heading-display mt-4 text-5xl sm:text-6xl max-w-3xl">
          {t("heading")}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
          {t("subhead")}
        </p>
      </section>

      <section className="container-page py-12">
        <div className="grid gap-5 sm:grid-cols-2">
          {services.map((s) => (
            <ServiceCard key={s.slug} service={s} />
          ))}
        </div>
      </section>
    </>
  );
}
