import { requireOrgContext } from "@/lib/data/org-context";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { organization, membership } = await requireOrgContext();

  return (
    <DashboardShell
      role={membership.role}
      orgName={organization.name}
      fullName={membership.full_name}
    >
      {children}
    </DashboardShell>
  );
}
