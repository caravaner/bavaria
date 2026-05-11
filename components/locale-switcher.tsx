"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

export function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("LocaleSwitcher");
  const [pending, startTransition] = useTransition();

  // Hide entirely when there's only one locale configured.
  if (routing.locales.length < 2) return null;

  return (
    <label className="ml-2 hidden sm:inline-flex items-center gap-1 text-sm">
      <span className="sr-only">{t("label")}</span>
      <select
        value={locale}
        disabled={pending}
        onChange={(e) => {
          const nextLocale = e.target.value as Locale;
          startTransition(() => {
            router.replace(pathname, { locale: nextLocale });
          });
        }}
        className="appearance-none bg-transparent text-muted hover:text-foreground px-2 py-1 cursor-pointer focus:outline-none"
      >
        {routing.locales.map((l) => (
          <option key={l} value={l}>
            {t(l as Parameters<typeof t>[0])}
          </option>
        ))}
      </select>
    </label>
  );
}
