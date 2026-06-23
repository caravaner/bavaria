/**
 * Small shared presentational primitives for the admin dashboard, so badges and
 * page chrome stay consistent across pages.
 */

type BadgeTone = "success" | "warning" | "info" | "danger" | "neutral";

const TONE: Record<BadgeTone, string> = {
  success:
    "bg-[var(--color-success-soft)] text-[var(--color-success)]",
  warning:
    "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
  info: "bg-[var(--color-info-soft)] text-[var(--color-info)]",
  danger: "bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
  neutral:
    "bg-[var(--color-neutral-soft)] text-[var(--color-muted)]",
};

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: BadgeTone;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TONE[tone]}`}
    >
      {children}
    </span>
  );
}

/** Page header with an optional right-hand action slot. */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4 border-b border-[var(--color-border)] pb-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-[var(--color-muted)]">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
