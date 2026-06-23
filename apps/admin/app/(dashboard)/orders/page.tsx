import Link from "next/link";
import { db, type OrderStatus, type Prisma } from "@bavaria/db";
import { Badge, PageHeader } from "@/components/ui";
import {
  ORDER_STATUS_OPTIONS,
  formatPrice,
  orderStatusTone,
  titleCaseStatus,
} from "@/lib/order-display";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 100;

function fmtDate(d: Date): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const status =
    sp.status && ORDER_STATUS_OPTIONS.includes(sp.status as OrderStatus)
      ? (sp.status as OrderStatus)
      : undefined;
  const q = sp.q?.trim() || undefined;

  const where: Prisma.OrderWhereInput = {
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { guestEmail: { contains: q, mode: "insensitive" } },
            { guestName: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
    }),
    db.order.count({ where }),
  ]);

  const selectClass =
    "rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]";

  return (
    <div>
      <PageHeader
        title="Orders"
        description="Bookings and payment intents, newest first."
      />

      <form method="get" className="mb-5 flex flex-wrap items-center gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search guest name or email…"
          className={`${selectClass} min-w-56 flex-1`}
        />
        <select name="status" defaultValue={status ?? ""} className={selectClass}>
          <option value="">All statuses</option>
          {ORDER_STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {titleCaseStatus(s)}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)]"
        >
          Filter
        </button>
        {(status || q) && (
          <Link
            href="/orders"
            className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]"
          >
            Clear
          </Link>
        )}
      </form>

      {orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-16 text-center text-sm text-[var(--color-muted)]">
          No orders match these filters yet.
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
            <table className="w-full text-sm">
              <thead className="bg-[var(--color-surface-2)] text-left text-xs uppercase tracking-wide text-[var(--color-muted)]">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Guest</th>
                  <th className="px-4 py-2.5 font-medium">Service</th>
                  <th className="px-4 py-2.5 font-medium">Amount</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr
                    key={o.id}
                    className="border-t border-[var(--color-border)] hover:bg-[var(--color-surface-2)]"
                  >
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/orders/${o.id}`}
                        className="font-medium text-[var(--color-accent)] hover:underline"
                      >
                        {o.guestName}
                      </Link>
                      <div className="text-xs text-[var(--color-muted)]">
                        {o.guestEmail}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-[var(--color-muted)]">
                      {o.serviceSlug}
                    </td>
                    <td className="px-4 py-2.5">
                      {formatPrice(o.amountCents, o.currency)}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge tone={orderStatusTone(o.status)}>
                        {titleCaseStatus(o.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-[var(--color-muted)]">
                      {fmtDate(o.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-[var(--color-muted)]">
            Showing {orders.length} of {total}
            {total > PAGE_SIZE ? ` (latest ${PAGE_SIZE})` : ""}.
          </p>
        </>
      )}
    </div>
  );
}
