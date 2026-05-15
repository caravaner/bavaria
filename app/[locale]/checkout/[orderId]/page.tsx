import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PayPalButtons } from "@/components/paypal-buttons";
import { db } from "@/lib/db";
import { getService } from "@/lib/services";
import { formatPrice } from "@/lib/services";

// Map our app locale to PayPal's locale codes
const PAYPAL_LOCALES: Record<string, string> = {
  en: "en_GB",
};

export async function generateMetadata(
  props: PageProps<"/[locale]/checkout/[orderId]">,
): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "Checkout" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    robots: { index: false, follow: false },
  };
}

export default async function CheckoutPage(
  props: PageProps<"/[locale]/checkout/[orderId]">,
) {
  const { locale, orderId } = await props.params;
  setRequestLocale(locale);

  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order || !order.paypalOrderId) notFound();

  // If the order is already captured/refunded/failed, send the user to the right page
  // rather than re-rendering checkout for a stale order.
  if (order.status === "CAPTURED") {
    const { redirect } = await import("@/i18n/navigation");
    redirect({ href: `/checkout/success?orderId=${order.id}`, locale });
  }

  const service = getService(order.serviceSlug);
  const t = await getTranslations("Checkout");
  const data = await getTranslations("ServicesData");
  const serviceTitle = data(
    `${order.serviceSlug}.title` as Parameters<typeof data>[0],
  );

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  if (!clientId) {
    throw new Error("NEXT_PUBLIC_PAYPAL_CLIENT_ID is not set");
  }

  return (
    <section className="container-page pt-20 pb-24 sm:pt-28">
      <Link
        href="/services"
        className="text-sm text-muted hover:text-foreground transition-colors"
      >
        {t("cancelLink")}
      </Link>

      <div className="mx-auto mt-8 max-w-3xl">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1 className="heading-display mt-4 text-4xl sm:text-5xl">
          {t("heading")}
        </h1>

        <div className="mt-10 rounded-2xl border border-subtle bg-surface p-8">
          <p className="eyebrow">{t("summaryEyebrow")}</p>
          <div className="mt-4 flex items-baseline justify-between gap-4">
            <p className="text-lg">
              <span className="text-muted">{t("for")} </span>
              <span className="font-medium">{serviceTitle}</span>
              <span className="text-muted"> · </span>
              <span className="text-muted">{order.guestName}</span>
            </p>
            <p className="text-2xl heading-display">
              {formatPrice(order.amountCents, order.currency as "EUR", locale)}
            </p>
          </div>

          <p className="mt-6 text-sm text-muted">{t("payInstructions")}</p>

          <div className="mt-6">
            <PayPalButtons
              paypalOrderId={order.paypalOrderId}
              localOrderId={order.id}
              clientId={clientId}
              currency={order.currency}
              locale={PAYPAL_LOCALES[locale] ?? "en_GB"}
              successHref={`/checkout/success?orderId=${order.id}`}
              cancelHref="/checkout/cancel"
              labels={{
                loading: t("loadingButton"),
                errorTitle: t("errorTitle"),
                errorBody: t("errorBody"),
                capturing: t("capturingTitle"),
                captureError: t("captureError"),
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

// Service may be referenced; avoid TS warning
void getService;
