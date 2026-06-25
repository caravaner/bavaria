import Link from "next/link";
import { db, type EmailStatus, type Prisma } from "@bavaria/db";
import { Badge, PageHeader } from "@/components/ui";
import {
  STATUS_OPTIONS,
  TEMPLATE_OPTIONS,
  statusTone,
  templateLabel,
} from "@/lib/email-display";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 100;

function fmtDate(d: Date): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

type Search = {
  status?: string;
  template?: string;
  q?: string;
};

export default async function EmailsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;

  const status =
    sp.status && STATUS_OPTIONS.includes(sp.status as EmailStatus)
      ? (sp.status as EmailStatus)
      : undefined;
  const template =
    sp.template && TEMPLATE_OPTIONS.includes(sp.template as never)
      ? sp.template
      : undefined;
  const q = sp.q?.trim() || undefined;

  const where: Prisma.EmailMessageWhereInput = {
    ...(status ? { status } : {}),
    ...(template ? { template } : {}),
    ...(q ? { toEmail: { contains: q, mode: "insensitive" } } : {}),
  };

  const [emails, total] = await Promise.all([
    db.emailMessage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
    }),
    db.emailMessage.count({ where }),
  ]);

  const selectClass =
    "rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]";

  return (
    <div>
      <PageHeader
        title="Emails"
        description="Every email the system has sent. Filter, inspect, and resend."
      />

      {/* Filters — plain GET form so it works without JS and is shareable. */}
      <form method="get" className="mb-5 flex flex-wrap items-center gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search recipient…"
          className={`${selectClass} min-w-56 flex-1`}
        />
        <select name="status" defaultValue={status ?? ""} className={selectClass}>
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
        <select
          name="template"
          defaultValue={template ?? ""}
          className={selectClass}
        >
          <option value="">All</option>
          {TEMPLATE_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {templateLabel(t)}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)]"
        >
          Filter
        </button>
        {(status || template || q) && (
          <Link
            href="/emails"
            className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]"
          >
            Clear
          </Link>
        )}
      </form>

      {emails.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-16 text-center text-sm text-[var(--color-muted)]">
          No emails match these filters yet.
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
            <table className="w-full text-sm">
              <thead className="bg-[var(--color-surface-2)] text-left text-xs uppercase tracking-wide text-[var(--color-muted)]">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Recipient</th>
                  <th className="px-4 py-2.5 font-medium">Template</th>
                  <th className="px-4 py-2.5 font-medium">Subject</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Sent</th>
                </tr>
              </thead>
              <tbody>
                {emails.map((e) => (
                  <tr
                    key={e.id}
                    className="border-t border-[var(--color-border)] hover:bg-[var(--color-surface-2)]"
                  >
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/emails/${e.id}`}
                        className="font-medium text-[var(--color-accent)] hover:underline"
                      >
                        {e.toName || e.toEmail}
                      </Link>
                      {e.toName ? (
                        <div className="text-xs text-[var(--color-muted)]">
                          {e.toEmail}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-2.5 text-[var(--color-muted)]">
                      {templateLabel(e.template)}
                    </td>
                    <td className="max-w-xs truncate px-4 py-2.5">
                      {e.subject}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge tone={statusTone(e.status)}>
                        {e.status.charAt(0) + e.status.slice(1).toLowerCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-[var(--color-muted)]">
                      {e.sentAt ? fmtDate(e.sentAt) : fmtDate(e.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-[var(--color-muted)]">
            Showing {emails.length} of {total}
            {total > PAGE_SIZE ? ` (latest ${PAGE_SIZE})` : ""}.
          </p>
        </>
      )}
    </div>
  );
}
