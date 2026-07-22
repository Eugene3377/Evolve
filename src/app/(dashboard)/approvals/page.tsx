import { redirect } from "next/navigation";
import { CheckSquare } from "lucide-react";
import { requireOrgContext, hasRole } from "@/lib/data/org-context";
import { listPendingExpenses, listPendingBills } from "@/lib/data/approvals";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { formatCurrency, formatDate } from "@/lib/utils";
import { decideExpense, decideBill } from "./actions";

export default async function ApprovalsPage() {
  const { organization, membership } = await requireOrgContext();
  if (!hasRole(membership.role, "manager")) redirect("/dashboard");

  const [expenses, bills] = await Promise.all([
    listPendingExpenses(organization.id),
    listPendingBills(organization.id),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <p className="text-sm text-ink-600">
        Review and decide on spend waiting for your sign-off.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Expenses ({expenses.length})</CardTitle>
        </CardHeader>
        {expenses.length === 0 ? (
          <EmptyState
            icon={CheckSquare}
            title="Nothing waiting on you"
            description="Submitted expenses that need a decision will show up here."
          />
        ) : (
          <ul className="divide-y divide-line">
            {expenses.map((expense) => (
              <li key={expense.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-ink-950">{expense.merchant}</p>
                    <p className="text-sm text-ink-600">
                      {expense.submitter?.full_name ?? "Unknown"} ·{" "}
                      {formatDate(expense.spent_at)} ·{" "}
                      {expense.category?.name ?? "Uncategorized"}
                      {expense.matched_transaction_id && " · Auto-matched"}
                    </p>
                    {expense.description && (
                      <p className="mt-1 text-sm text-ink-700">{expense.description}</p>
                    )}
                  </div>
                  <p className="font-ledger text-lg font-semibold text-ink-950">
                    {formatCurrency(expense.amount, expense.currency)}
                  </p>
                </div>
                <form action={decideExpense} className="mt-3 flex flex-wrap items-center gap-2">
                  <input type="hidden" name="expense_id" value={expense.id} />
                  <Input
                    name="reason"
                    placeholder="Reason (required if rejecting)"
                    className="max-w-xs"
                  />
                  <Button size="sm" name="decision" value="approved" type="submit">
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    name="decision"
                    value="rejected"
                    type="submit"
                  >
                    Reject
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bills ({bills.length})</CardTitle>
        </CardHeader>
        {bills.length === 0 ? (
          <EmptyState
            icon={CheckSquare}
            title="No bills waiting"
            description="Bills marked awaiting approval will appear here."
          />
        ) : (
          <ul className="divide-y divide-line">
            {bills.map((bill) => (
              <li key={bill.id} className="flex flex-wrap items-center justify-between gap-3 p-5">
                <div>
                  <p className="font-medium text-ink-950">{bill.vendor_name}</p>
                  <p className="text-sm text-ink-600">
                    {bill.invoice_number ? `#${bill.invoice_number} · ` : ""}
                    Due {bill.due_date ? formatDate(bill.due_date) : "—"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-ledger text-lg font-semibold text-ink-950">
                    {formatCurrency(bill.amount, bill.currency)}
                  </p>
                  <form action={decideBill} className="flex gap-2">
                    <input type="hidden" name="bill_id" value={bill.id} />
                    <Button size="sm" name="decision" value="approved" type="submit">
                      Approve
                    </Button>
                    <Button size="sm" variant="danger" name="decision" value="void" type="submit">
                      Void
                    </Button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
