import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { author } from "@/lib/author";
import { brand } from "@/lib/brand";

export function Footer() {
  const t = useTranslations("Footer");
  const nav = useTranslations("Nav");
  const year = new Date().getFullYear();

  return (
    <footer className="mt-32 border-t border-subtle">
      <div className="container-page py-12 grid gap-8 sm:grid-cols-3">
        <div>
          <p className="heading-display text-2xl">{brand.name}</p>
          <p className="mt-2 text-sm text-muted max-w-xs">
            {t("tagline", { name: author.name })}
          </p>
        </div>
        <div>
          <p className="eyebrow">{t("explore")}</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/services" className="hover:text-accent transition-colors">{nav("services")}</Link></li>
            <li><Link href="/about" className="hover:text-accent transition-colors">{nav("about")}</Link></li>
            <li><Link href="/contact" className="hover:text-accent transition-colors">{nav("contact")}</Link></li>
          </ul>
        </div>
        <div>
          <p className="eyebrow">{t("getInTouch")}</p>
          <p className="mt-3 text-sm">
            <a href={`mailto:${author.email}`} className="hover:text-accent transition-colors">
              {author.email}
            </a>
          </p>
        </div>
      </div>
      <div className="container-page py-6 text-xs text-muted border-t border-subtle">
        {t("rights", { year, brand: brand.name })}
      </div>
    </footer>
  );
}
