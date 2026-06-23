import { LogOut } from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { logout } from "@/app/actions/auth";
import { SidebarNav } from "@/components/sidebar-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="px-5 py-5">
          <p className="text-sm font-semibold tracking-tight">Career Restart</p>
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
            Admin
          </p>
        </div>

        <SidebarNav />

        <div className="mt-auto border-t border-[var(--color-border)] px-4 py-4">
          <p className="px-1 pb-2 text-xs text-[var(--color-muted)]">
            Signed in as{" "}
            <span className="font-medium text-[var(--color-foreground)]">
              {admin.username}
            </span>
          </p>
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-medium text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-foreground)]"
            >
              <LogOut size={16} strokeWidth={2} />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-5xl px-8 py-10">{children}</div>
      </main>
    </div>
  );
}
