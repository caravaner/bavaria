import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ContactForm } from "@/components/contact-form";
import { author } from "@/lib/author";

export async function generateMetadata(
  props: PageProps<"/[locale]/contact">,
): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "Contact" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function ContactPage(
  props: PageProps<"/[locale]/contact">,
) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  const t = await getTranslations("Contact");

  return (
    <section className="container-page pt-20 pb-24 sm:pt-28">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <p className="eyebrow">{t("eyebrow")}</p>
          <h1 className="heading-display mt-4 text-5xl sm:text-6xl">
            {t("heading")}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted">
            {t("intro")}
          </p>
          <div className="mt-12 space-y-2 text-sm">
            <p className="eyebrow">{t("orEmail")}</p>
            <p>
              <a
                href={`mailto:${author.email}`}
                className="text-lg hover:text-accent transition-colors"
              >
                {author.email}
              </a>
            </p>
          </div>
        </div>
        <div className="lg:col-span-7">
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
