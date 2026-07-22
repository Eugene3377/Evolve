import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { requireOrgContext, hasRole } from "@/lib/data/org-context";
import { listAuditLogs } from "@/lib/data/audit-log";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/utils";

const ACTION_LABEL: Record<string, string> = {
  "expense.submitted": "submitted an expense",
  "expense.approved": "approved an expense",
  "expense.rejected": "rejected an expense",
  "bill.created": "created a bill",
  "bill.submitted": "sent a bill for approval",
  "bill.approved": "approved a bill",
  "bill.void": "voided a bill",
  "bill.paid": "marked a bill paid",
  "member.invited": "invited a teammate",
  "member.role_changed": "changed a role",
  "member.removed": "removed a teammate",
  "invite.revoked": "revoked an invite",
  "transaction.recorded": "recorded a transaction",
};

export default async function AuditLogPage() {
  const { organization, membership } = await requireOrgContext();
  if (!hasRole(membership.role, "manager")) redirect("/dashboard");

  const logs = await listAuditLogs(organization.id);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <p className="text-sm text-ink-600">
        Every sensitive action taken in your organization, newest first.
      </p>

      <Card className="overflow-hidden">
        {logs.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="Nothing logged yet"
            description="Approvals, invites, role changes, and payments will show up here as they happen."
          />
        ) : (
          <ul className="divide-y divide-line">
            {logs.map((log) => (
              <li key={log.id} className="flex items-start justify-between gap-4 px-5 py-3.5 text-sm">
                <div>
                  <span className="font-medium text-ink-950">
                    {log.actor?.full_name ?? "Someone"}
                  </span>{" "}
                  <span className="text-ink-700">
                    {ACTION_LABEL[log.action] ?? log.action.replace(/_/g, " ").replace(/\./g, " ")}
                  </span>
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <p className="mt-0.5 text-xs text-ink-600">
                      {Object.entries(log.metadata)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(" · ")}
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-xs text-ink-600">
                  {formatDateTime(log.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
