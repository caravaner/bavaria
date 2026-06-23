import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { db } from "@bavaria/db";
import { Badge } from "@/components/ui";
import { ReminderForm } from "@/components/email-actions";
import { statusTone, templateLabel } from "@/lib/email-display";
import {
  formatPrice,
  orderStatusTone,
  titleCaseStatus,
} from "@/lib/order-display";

export const dynamic = "force-dynamic";

function fmt(d: Date | null): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm">{value || "—"}</dd>
    </div>
  );
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await db.order.findUnique({
    where: { id },
    include: { emails: { orderBy: { createdAt: "desc" } } },
  });
  if (!order) notFound();

  return (
    <div>
      <Link
        href="/orders"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
      >
        <ArrowLeft size={16} strokeWidth={2} />
        Back to orders
      </Link>

      <div className="mb-6 flex items-start justify-between gap-4 border-b border-[var(--color-border)] pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight">
              {order.guestName}
            </h1>
            <Badge tone={orderStatusTone(order.status)}>
              {titleCaseStatus(order.status)}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {order.guestEmail} · {formatPrice(order.amountCents, order.currency)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <dl className="grid grid-cols-2 gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <Field label="Service" value={order.serviceSlug} />
            <Field
              label="Amount"
              value={formatPrice(order.amountCents, order.currency)}
            />
            <Field label="Scheduled for" value={fmt(order.scheduledFor)} />
            <Field label="Created" value={fmt(order.createdAt)} />
            <Field label="Captured" value={fmt(order.capturedAt)} />
            <Field label="Refunded" value={fmt(order.refundedAt)} />
            <Field
              label="Order id"
              value={<span className="font-mono text-xs">{order.id}</span>}
            />
            <Field
              label="PayPal order"
              value={
                order.paypalOrderId ? (
                  <span className="font-mono text-xs">
                    {order.paypalOrderId}
                  </span>
                ) : null
              }
            />
          </dl>

          {order.notes ? (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
              <h2 className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
                Booking notes
              </h2>
              <p className="mt-2 whitespace-pre-wrap text-sm">{order.notes}</p>
            </div>
          ) : null}

          {/* Emails sent for this order */}
          <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
            <div className="border-b border-[var(--color-border)] px-5 py-3 text-sm font-semibold">
              Emails ({order.emails.length})
            </div>
            {order.emails.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-[var(--color-muted)]">
                No emails sent for this order yet.
              </p>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {order.emails.map((e) => (
                    <tr
                      key={e.id}
                      className="border-t border-[var(--color-border)] first:border-0 hover:bg-[var(--color-surface-2)]"
                    >
                      <td className="px-5 py-2.5">
                        <Link
                          href={`/emails/${e.id}`}
                          className="font-medium text-[var(--color-accent)] hover:underline"
                        >
                          {templateLabel(e.template)}
                        </Link>
                        <div className="text-xs text-[var(--color-muted)]">
                          {e.toEmail}
                        </div>
                      </td>
                      <td className="px-5 py-2.5">
                        <Badge tone={statusTone(e.status)}>
                          {e.status.charAt(0) + e.status.slice(1).toLowerCase()}
                        </Badge>
                      </td>
                      <td className="px-5 py-2.5 text-right text-xs text-[var(--color-muted)]">
                        {fmt(e.sentAt ?? e.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-6">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <h2 className="text-sm font-semibold">Send a reminder</h2>
            <p className="mb-3 mt-1 text-xs text-[var(--color-muted)]">
              Sends a reminder to {order.guestEmail} for this booking.
            </p>
            <ReminderForm orderId={order.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
