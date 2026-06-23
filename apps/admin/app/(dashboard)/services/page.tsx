import Link from "next/link";
import { Plus } from "lucide-react";
import { listServicesAdmin, DEFAULT_LOCALE } from "@bavaria/db";
import { toggleServiceActive } from "@/app/actions/services";
import { Badge, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

function formatPrice(cents: number, currency: string): string {
  const hasCents = cents % 100 !== 0;
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      minimumFractionDigits: hasCents ? 2 : 0,
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}

export default async function ServicesListPage() {
  const services = await listServicesAdmin();

  return (
    <div>
      <PageHeader
        title="Services"
        description="Services shown on the public site."
        action={
          <Link
            href="/services/new"
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)]"
          >
            <Plus size={16} strokeWidth={2.4} />
            New service
          </Link>
        }
      />

      {services.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-16 text-center text-sm text-[var(--color-muted)]">
          No services yet. Create your first one.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-surface-2)] text-left text-xs uppercase tracking-wide text-[var(--color-muted)]">
              <tr>
                <th className="px-4 py-2.5 font-medium">Title</th>
                <th className="px-4 py-2.5 font-medium">Slug</th>
                <th className="px-4 py-2.5 font-medium">Price</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {services.map((s) => {
                const en =
                  s.translations.find((t) => t.locale === DEFAULT_LOCALE) ??
                  s.translations[0];
                return (
                  <tr
                    key={s.id}
                    className="border-t border-[var(--color-border)] hover:bg-[var(--color-surface-2)]"
                  >
                    <td className="px-4 py-2.5 font-medium">
                      {en?.title ?? s.slug}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-[var(--color-muted)]">
                      {s.slug}
                    </td>
                    <td className="px-4 py-2.5">
                      {formatPrice(s.priceCents, s.currency)}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge tone={s.active ? "success" : "neutral"}>
                        {s.active ? "Active" : "Hidden"}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-4">
                        <form action={toggleServiceActive}>
                          <input type="hidden" name="id" value={s.id} />
                          <input
                            type="hidden"
                            name="active"
                            value={(!s.active).toString()}
                          />
                          <button
                            type="submit"
                            className="text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                          >
                            {s.active ? "Hide" : "Show"}
                          </button>
                        </form>
                        <Link
                          href={`/services/${s.id}`}
                          className="font-medium text-[var(--color-accent)] hover:underline"
                        >
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
