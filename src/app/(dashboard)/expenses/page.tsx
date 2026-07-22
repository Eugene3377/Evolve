import Link from "next/link";
import { Plus, Receipt as ReceiptIcon } from "lucide-react";
import { requireOrgContext, hasRole } from "@/lib/data/org-context";
import { listExpenses } from "@/lib/data/expenses";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { EmptyState } from "@/components/ui/empty-state";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { ExpenseStatus } from "@/types/domain";

const TABS: { label: string; value?: ExpenseStatus }[] = [
  { label: "All" },
  { label: "Draft", value: "draft" },
  { label: "Submitted", value: "submitted" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { organization, membership } = await requireOrgContext();
  const params = await searchParams;
  const isManagerOrAdmin = hasRole(membership.role, "manager");
  const activeStatus = (params.status as ExpenseStatus | undefined) ?? undefined;

  const expenses = await listExpenses({
    orgId: organization.id,
    memberId: membership.id,
    isManagerOrAdmin,
    status: activeStatus,
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-ink-600">
            {isManagerOrAdmin
              ? "Every expense submitted across your organization."
              : "Expenses you've submitted, from draft to reimbursed."}
          </p>
        </div>
        <Link href="/expenses/new">
          <Button>
            <Plus className="h-4 w-4" />
            New expense
          </Button>
        </Link>
      </div>

      <div className="flex gap-1 border-b border-line">
        {TABS.map((tab) => {
          const href = tab.value ? `/expenses?status=${tab.value}` : "/expenses";
          const active = activeStatus === tab.value;
          return (
            <Link
              key={tab.label}
              href={href}
              className={cn(
                "border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "border-brass-500 text-ink-950"
                  : "border-transparent text-ink-600 hover:text-ink-950"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <Card className="overflow-hidden">
        {expenses.length === 0 ? (
          <EmptyState
            icon={ReceiptIcon}
            title="No expenses here yet"
            description="Submit your first expense with a receipt and we'll try to match it to your transaction feed automatically."
            action={
              <Link href="/expenses/new">
                <Button size="sm">
                  <Plus className="h-4 w-4" />
                  New expense
                </Button>
              </Link>
            }
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-600">
                <th className="px-5 py-3 font-medium">Merchant</th>
                <th className="px-5 py-3 font-medium">Category</th>
                {isManagerOrAdmin && (
                  <th className="px-5 py-3 font-medium">Submitted by</th>
                )}
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr
                  key={expense.id}
                  className="border-b border-line last:border-0 hover:bg-paper-50"
                >
                  <td className="px-5 py-3">
                    <Link
                      href={`/expenses/${expense.id}`}
                      className="font-medium text-ink-950 hover:text-brass-600"
                    >
                      {expense.merchant}
                    </Link>
                    {expense.matched_transaction_id && (
                      <span className="ml-2 rounded-full bg-positive-100 px-2 py-0.5 text-[10px] font-medium text-positive-600">
                        Matched
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-ink-700">
                    {expense.category?.name ?? "Uncategorized"}
                  </td>
                  {isManagerOrAdmin && (
                    <td className="px-5 py-3 text-ink-700">
                      {expense.submitter?.full_name ?? "—"}
                    </td>
                  )}
                  <td className="px-5 py-3 text-ink-700">
                    {formatDate(expense.spent_at)}
                  </td>
                  <td className="px-5 py-3">
                    <StatusPill status={expense.status} />
                  </td>
                  <td className="px-5 py-3 text-right font-ledger font-medium">
                    {formatCurrency(expense.amount, expense.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
