import Link from "next/link";
import { Plus, FileText } from "lucide-react";
import { requireOrgContext, hasRole } from "@/lib/data/org-context";
import { listBills } from "@/lib/data/bills";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { markBillPaid } from "./actions";

export default async function BillsPage() {
  const { organization, membership } = await requireOrgContext();
  const isManagerOrAdmin = hasRole(membership.role, "manager");
  const bills = await listBills(organization.id);

  async function payAction(formData: FormData) {
    "use server";
    await markBillPaid(String(formData.get("bill_id")));
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-600">
          Vendor invoices and bills, from draft through payment.
        </p>
        {isManagerOrAdmin && (
          <Link href="/bills/new">
            <Button>
              <Plus className="h-4 w-4" />
              New bill
            </Button>
          </Link>
        )}
      </div>

      <Card className="overflow-hidden">
        {bills.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No bills yet"
            description="Add a vendor invoice to start tracking what your company owes."
            action={
              isManagerOrAdmin ? (
                <Link href="/bills/new">
                  <Button size="sm">
                    <Plus className="h-4 w-4" />
                    New bill
                  </Button>
                </Link>
              ) : undefined
            }
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-600">
                <th className="px-5 py-3 font-medium">Vendor</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Due</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Amount</th>
                {isManagerOrAdmin && <th className="px-5 py-3" />}
              </tr>
            </thead>
            <tbody>
              {bills.map((bill) => (
                <tr key={bill.id} className="border-b border-line last:border-0 hover:bg-paper-50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-ink-950">{bill.vendor_name}</p>
                    {bill.invoice_number && (
                      <p className="text-xs text-ink-600">#{bill.invoice_number}</p>
                    )}
                  </td>
                  <td className="px-5 py-3 text-ink-700">{bill.category?.name ?? "Uncategorized"}</td>
                  <td className="px-5 py-3 text-ink-700">
                    {bill.due_date ? formatDate(bill.due_date) : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <StatusPill status={bill.status} />
                  </td>
                  <td className="px-5 py-3 text-right font-ledger font-medium">
                    {formatCurrency(bill.amount, bill.currency)}
                  </td>
                  {isManagerOrAdmin && (
                    <td className="px-5 py-3 text-right">
                      {bill.status === "approved" || bill.status === "scheduled" ? (
                        <form action={payAction}>
                          <input type="hidden" name="bill_id" value={bill.id} />
                          <Button size="sm" variant="secondary" type="submit">
                            Mark paid
                          </Button>
                        </form>
                      ) : null}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
