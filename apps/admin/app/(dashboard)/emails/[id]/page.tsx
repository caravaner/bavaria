import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { db } from "@bavaria/db";
import { Badge } from "@/components/ui";
import { ReminderForm, ResendButton } from "@/components/email-actions";
import { statusTone, templateLabel } from "@/lib/email-display";

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

export default async function EmailDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const email = await db.emailMessage.findUnique({ where: { id } });
  if (!email) notFound();

  return (
    <div>
      <Link
        href="/emails"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
      >
        <ArrowLeft size={16} strokeWidth={2} />
        Back to emails
      </Link>

      <div className="mb-6 flex items-start justify-between gap-4 border-b border-[var(--color-border)] pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight">
              {email.subject}
            </h1>
            <Badge tone={statusTone(email.status)}>
              {email.status.charAt(0) + email.status.slice(1).toLowerCase()}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {templateLabel(email.template)} → {email.toEmail}
          </p>
        </div>
        <ResendButton id={email.id} />
      </div>

      {email.status === "FAILED" && email.error ? (
        <div className="mb-6 rounded-xl border border-[var(--color-danger-soft)] bg-[var(--color-danger-soft)] px-4 py-3 text-sm text-[var(--color-danger)]">
          <span className="font-medium">Send failed:</span> {email.error}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Rendered preview */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2">
          <div className="border-b border-[var(--color-border)] px-3 py-2 text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
            Preview
          </div>
          {email.bodyHtml ? (
            <iframe
              title="Email preview"
              srcDoc={email.bodyHtml}
              className="h-[520px] w-full rounded-b-lg"
              sandbox=""
            />
          ) : (
            <p className="px-3 py-8 text-center text-sm text-[var(--color-muted)]">
              No rendered body stored.
            </p>
          )}
        </div>

        {/* Metadata + actions */}
        <div className="space-y-6">
          <dl className="grid grid-cols-2 gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <Field label="To" value={email.toName ?? email.toEmail} />
            <Field label="From" value={email.fromEmail} />
            <Field label="Locale" value={email.locale} />
            <Field label="Attempts" value={email.attempts} />
            <Field label="Created" value={fmt(email.createdAt)} />
            <Field label="Sent" value={fmt(email.sentAt)} />
            <Field
              label="Provider id"
              value={
                email.providerMessageId ? (
                  <span className="font-mono text-xs">
                    {email.providerMessageId}
                  </span>
                ) : null
              }
            />
            <Field
              label="Booking"
              value={
                email.orderId ? (
                  <span className="font-mono text-xs">{email.orderId}</span>
                ) : null
              }
            />
          </dl>

          <details className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <summary className="cursor-pointer text-sm font-medium">
              Render context
            </summary>
            <pre className="mt-3 overflow-x-auto rounded-lg bg-[var(--color-surface-2)] p-3 text-xs">
              {JSON.stringify(email.context, null, 2)}
            </pre>
          </details>

          {email.orderId ? (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
              <h2 className="text-sm font-semibold">Send a reminder</h2>
              <p className="mb-3 mt-1 text-xs text-[var(--color-muted)]">
                Sends a reminder to {email.toEmail} for this booking.
              </p>
              <ReminderForm orderId={email.orderId} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
