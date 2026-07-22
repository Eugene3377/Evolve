import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileDown } from "lucide-react";
import { requireOrgContext, hasRole } from "@/lib/data/org-context";
import { getExpense, receiptSignedUrl } from "@/lib/data/expenses";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { deleteDraftExpense, submitDraftExpense } from "../actions";

export default async function ExpenseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { organization, membership } = await requireOrgContext();
  const expense = await getExpense(organization.id, id);

  if (!expense) notFound();

  const isOwner = expense.submitted_by === membership.id;
  const canSee = isOwner || hasRole(membership.role, "manager");
  if (!canSee) notFound();

  const receiptUrl = expense.receipt_path
    ? await receiptSignedUrl(expense.receipt_path)
    : null;

  async function submitAction() {
    "use server";
    await submitDraftExpense(id);
  }
  async function deleteAction() {
    "use server";
    await deleteDraftExpense(id);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link
        href="/expenses"
        className="inline-flex items-center gap-1.5 text-sm text-ink-600 hover:text-ink-950"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to expenses
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>{expense.merchant}</CardTitle>
          <StatusPill status={expense.status} />
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <Detail label="Amount">
              <span className="font-ledger">
                {formatCurrency(expense.amount, expense.currency)}
              </span>
            </Detail>
            <Detail label="Date spent">{formatDate(expense.spent_at)}</Detail>
            <Detail label="Category">
              {expense.category?.name ?? "Uncategorized"}
            </Detail>
            <Detail label="Submitted by">
              {expense.submitter?.full_name ?? "—"}
            </Detail>
            <Detail label="Submitted">
              {expense.submitted_at ? formatDateTime(expense.submitted_at) : "Not yet submitted"}
            </Detail>
            {expense.decided_at && (
              <Detail label="Decided">{formatDateTime(expense.decided_at)}</Detail>
            )}
          </div>

          {expense.description && (
            <Detail label="Description">
              <p className="text-ink-800">{expense.description}</p>
            </Detail>
          )}

          {expense.matched_transaction_id && (
            <p className="rounded-md bg-positive-100 px-3 py-2 text-sm text-positive-600">
              Auto-matched to a transaction on your feed.
            </p>
          )}

          {expense.status === "rejected" && expense.rejection_reason && (
            <p className="rounded-md bg-danger-100 px-3 py-2 text-sm text-danger-600">
              {expense.rejection_reason}
            </p>
          )}

          {receiptUrl && (
            <a
              href={receiptUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brass-600 hover:underline"
            >
              <FileDown className="h-4 w-4" /> View receipt
            </a>
          )}

          {isOwner && expense.status === "draft" && (
            <div className="flex gap-3 border-t border-line pt-4">
              <form action={submitAction}>
                <Button size="sm" type="submit">
                  Submit for approval
                </Button>
              </form>
              <form action={deleteAction}>
                <Button size="sm" variant="danger" type="submit">
                  Delete draft
                </Button>
              </form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-ink-600">{label}</p>
      <div className="mt-0.5 text-ink-950">{children}</div>
    </div>
  );
}
