import type { Metadata } from "next";
import { Geist, Instrument_Serif } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import "../globals.css";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { brand } from "@/lib/brand";
import { author } from "@/lib/author";
import { routing } from "@/i18n/routing";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://bavaria.example.com"),
  title: {
    default: `${brand.name} — Coaching with ${author.name}`,
    template: `%s — ${brand.name}`,
  },
  description: brand.description,
  openGraph: {
    type: "website",
    siteName: brand.name,
  },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout(props: LayoutProps<"/[locale]">) {
  const { locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      className={`${geist.variable} ${instrumentSerif.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <NextIntlClientProvider>
          <Nav />
          <main className="flex-1">{props.children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
