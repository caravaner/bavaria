import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { author } from "@/lib/author";

export async function generateMetadata(
  props: PageProps<"/[locale]/about">,
): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "About" });
  const a = await getTranslations({ locale, namespace: "Author" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription", { name: a("name"), role: a("title") }),
  };
}

export default async function AboutPage(props: PageProps<"/[locale]/about">) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  const t = await getTranslations("About");
  const a = await getTranslations("Author");

  const pillarKeys = ["vision", "mission", "message"] as const;
  const bioKeys = ["p1", "p2", "p3", "p4"] as const;

  return (
    <>
      <section className="container-page pt-20 pb-16 sm:pt-28">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <div className="sticky top-24">
              <div className="relative aspect-[2/3] overflow-hidden rounded-3xl bg-accent-soft">
                <Image
                  src={author.imageSrc}
                  alt={a("portraitAlt", { name: a("name") })}
                  fill
                  priority
                  sizes="(min-width: 1024px) 40vw, 100vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
          <div className="lg:col-span-7">
            <p className="eyebrow">{t("eyebrow")}</p>
            <h1 className="heading-display mt-4 text-5xl sm:text-6xl">
              {a("name")}
            </h1>
            <p className="mt-2 text-lg text-muted">{a("title")}</p>
            <div className="mt-10 space-y-6 text-lg leading-relaxed">
              {bioKeys.map((k) => (
                <p key={k}>{a(`bio.${k}` as Parameters<typeof a>[0])}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-subtle bg-surface">
        <div className="container-page py-20 sm:py-24">
          <div className="max-w-2xl">
            <p className="eyebrow">{t("pillarsEyebrow")}</p>
            <h2 className="heading-display mt-3 text-4xl sm:text-5xl">
              {t("pillarsHeading")}
            </h2>
          </div>
          <div className="mt-14 grid gap-10 md:grid-cols-3">
            {pillarKeys.map((key) => (
              <div key={key} className="border-t border-foreground/20 pt-6">
                <span className="eyebrow text-accent">
                  {a(`pillars.${key}.label` as Parameters<typeof a>[0])}
                </span>
                <h3 className="heading-display mt-3 text-2xl">
                  {a(`pillars.${key}.title` as Parameters<typeof a>[0])}
                </h3>
                <p className="mt-3 leading-relaxed text-muted">
                  {a(`pillars.${key}.body` as Parameters<typeof a>[0])}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-20 sm:py-24">
        <div className="rounded-3xl border border-subtle bg-surface p-10 sm:p-14 max-w-3xl mx-auto text-center">
          <p className="eyebrow text-accent">{t("closingEyebrow")}</p>
          <p className="heading-display mt-4 text-3xl sm:text-4xl">
            {a("ctaQuote")}
          </p>
          <p className="mt-4 text-muted">{a("ctaFollow")}</p>
          <Link
            href="/contact"
            className="mt-8 inline-flex items-center rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background hover:bg-accent hover:text-foreground transition-colors"
          >
            {t("closingCta")}
          </Link>
        </div>
      </section>
    </>
  );
}
