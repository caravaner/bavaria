import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en"] as const,
  defaultLocale: "en",
  /** Default locale has no prefix; future locales get a /xx prefix. */
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
