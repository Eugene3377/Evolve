import { ArrowLeftRight } from "lucide-react";
import { requireOrgContext, hasRole } from "@/lib/data/org-context";
import { listTransactions } from "@/lib/data/transactions";
import { listCategories } from "@/lib/data/expenses";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { AddTransactionButton } from "./add-transaction-button";

export default async function TransactionsPage() {
  const { organization, membership } = await requireOrgContext();
  const isManagerOrAdmin = hasRole(membership.role, "manager");

  const [transactions, categories] = await Promise.all([
    listTransactions({ orgId: organization.id }),
    listCategories(organization.id),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-600">
          Card and bank activity across your organization, ready to reconcile
          against submitted expenses.
        </p>
        {isManagerOrAdmin && <AddTransactionButton categories={categories} />}
      </div>

      <Card className="overflow-hidden">
        {transactions.length === 0 ? (
          <EmptyState
            icon={ArrowLeftRight}
            title="No transactions yet"
            description="Connect a card feed through an Edge Function webhook, or record activity manually to get started."
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-600">
                <th className="px-5 py-3 font-medium">Merchant</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Cardholder</th>
                <th className="px-5 py-3 font-medium">Time</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((txn) => (
                <tr key={txn.id} className="border-b border-line last:border-0 hover:bg-paper-50">
                  <td className="px-5 py-3 font-medium text-ink-950">{txn.merchant}</td>
                  <td className="px-5 py-3 text-ink-700">{txn.category?.name ?? "Uncategorized"}</td>
                  <td className="px-5 py-3 text-ink-700">{txn.member?.full_name ?? "—"}</td>
                  <td className="px-5 py-3 text-ink-700">{formatDateTime(txn.occurred_at)}</td>
                  <td className="px-5 py-3">
                    <StatusPill status={txn.status} />
                  </td>
                  <td className="px-5 py-3 text-right font-ledger font-medium">
                    {formatCurrency(txn.amount, txn.currency)}
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
