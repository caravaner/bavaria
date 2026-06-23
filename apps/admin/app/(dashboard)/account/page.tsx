import { requireAdmin } from "@/lib/session";
import { PasswordForm } from "@/components/password-form";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const admin = await requireAdmin();

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Account"
        description={`Signed in as ${admin.username}.`}
      />

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          Change password
        </h2>
        <div className="mt-4">
          <PasswordForm />
        </div>
      </div>
    </div>
  );
}
