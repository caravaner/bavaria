import Link from "next/link";
import { Briefcase, CheckCircle2, Mail, CalendarCheck } from "lucide-react";
import { db } from "@bavaria/db";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function DashboardHome() {
  const [serviceCount, activeCount, capturedOrders, emailsSent] =
    await Promise.all([
      db.service.count(),
      db.service.count({ where: { active: true } }),
      db.order.count({ where: { status: "CAPTURED" } }),
      db.emailMessage.count({ where: { status: "SENT" } }),
    ]);

  const stats = [
    { label: "Services", value: serviceCount, icon: Briefcase },
    { label: "Active services", value: activeCount, icon: CheckCircle2 },
    { label: "Confirmed bookings", value: capturedOrders, icon: CalendarCheck },
    { label: "Emails sent", value: emailsSent, icon: Mail },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of services, bookings, and email activity."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-[var(--color-muted)]">{label}</p>
              <Icon
                size={18}
                className="text-[var(--color-muted)]"
                strokeWidth={2}
              />
            </div>
            <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/services"
          className="inline-flex items-center rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)]"
        >
          Manage services
        </Link>
        <Link
          href="/emails"
          className="inline-flex items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium hover:bg-[var(--color-surface-2)]"
        >
          View emails
        </Link>
      </div>
    </div>
  );
}
