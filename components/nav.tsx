import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { brand } from "@/lib/brand";
import { LocaleSwitcher } from "./locale-switcher";

export function Nav() {
  const t = useTranslations("Nav");
  const links = [
    { href: "/services", label: t("services") },
    { href: "/about", label: t("about") },
    { href: "/contact", label: t("contact") },
  ] as const;

  return (
    <header className="sticky top-0 z-40 border-b border-subtle/70 bg-background/80 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between">
        <Link
          href="/"
          className="heading-display text-xl tracking-tight hover:text-accent transition-colors"
        >
          {brand.name}
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="px-3 py-2 text-sm text-muted hover:text-foreground transition-colors"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/contact"
            className="ml-2 hidden sm:inline-flex items-center rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-accent hover:text-foreground transition-colors"
          >
            {t("bookCta")}
          </Link>
          <LocaleSwitcher />
        </nav>
      </div>
    </header>
  );
}
