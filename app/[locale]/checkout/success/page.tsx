import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function generateMetadata(
  props: PageProps<"/[locale]/checkout/success">,
): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "CheckoutSuccess" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    robots: { index: false, follow: false },
  };
}

export default async function CheckoutSuccessPage(
  props: PageProps<"/[locale]/checkout/success">,
) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  const t = await getTranslations("CheckoutSuccess");
  const nextItems = (t.raw("nextItems") ?? []) as string[];

  return (
    <section className="container-page py-24 sm:py-32">
      <div className="mx-auto max-w-2xl text-center">
        <CheckmarkIcon />
        <p className="eyebrow mt-8 text-accent">{t("eyebrow")}</p>
        <h1 className="heading-display mt-4 text-5xl sm:text-6xl">
          {t("heading")}
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-muted">{t("body")}</p>
      </div>

      <div className="mx-auto mt-16 max-w-2xl rounded-2xl border border-subtle bg-surface p-8 sm:p-10">
        <p className="eyebrow">{t("next")}</p>
        <ol className="mt-4 space-y-3">
          {nextItems.map((item, i) => (
            <li key={i} className="flex gap-4 text-base leading-relaxed">
              <span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-medium text-foreground">
                {i + 1}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-12 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background hover:bg-accent hover:text-foreground transition-colors"
        >
          {t("homeCta")}
        </Link>
        <Link
          href="/services"
          className="inline-flex items-center rounded-full border border-foreground/20 px-6 py-3 text-sm font-medium hover:border-foreground/50 transition-colors"
        >
          {t("servicesCta")}
        </Link>
      </div>
    </section>
  );
}

function CheckmarkIcon() {
  return (
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent-soft">
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="h-8 w-8 text-foreground"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
    </div>
  );
}
