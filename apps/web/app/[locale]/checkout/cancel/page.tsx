import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function generateMetadata(
  props: PageProps<"/[locale]/checkout/cancel">,
): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "CheckoutCancel" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    robots: { index: false, follow: false },
  };
}

export default async function CheckoutCancelPage(
  props: PageProps<"/[locale]/checkout/cancel">,
) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  const t = await getTranslations("CheckoutCancel");

  return (
    <section className="container-page py-24 sm:py-32">
      <div className="mx-auto max-w-2xl text-center">
        <InfoIcon />
        <p className="eyebrow mt-8">{t("eyebrow")}</p>
        <h1 className="heading-display mt-4 text-5xl sm:text-6xl">
          {t("heading")}
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-muted">{t("body")}</p>
      </div>

      <div className="mt-12 flex flex-wrap justify-center gap-3">
        <Link
          href="/services"
          className="inline-flex items-center rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background hover:bg-accent hover:text-foreground transition-colors"
        >
          {t("tryAgain")}
        </Link>
        <Link
          href="/contact"
          className="inline-flex items-center rounded-full border border-foreground/20 px-6 py-3 text-sm font-medium hover:border-foreground/50 transition-colors"
        >
          {t("contact")}
        </Link>
      </div>
    </section>
  );
}

function InfoIcon() {
  return (
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-subtle bg-surface">
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="h-7 w-7 text-muted"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="9" />
        <line x1="12" y1="8" x2="12" y2="13" />
        <line x1="12" y1="16.5" x2="12.01" y2="16.5" />
      </svg>
    </div>
  );
}
