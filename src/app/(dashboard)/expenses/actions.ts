"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireOrgContext } from "@/lib/data/org-context";
import { logAuditEvent } from "@/lib/data/audit";

export interface ExpenseFormState {
  error?: string;
}

/**
 * Attempts to auto-match a newly submitted expense against an existing,
 * unmatched transaction on the org's feed — same merchant (fuzzy), amount
 * within a cent of rounding, and occurring within 5 days of the spend
 * date. This is the "auto-matching" step referenced in the product brief:
 * it lets an employee's self-reported expense reconcile itself against
 * the transaction feed without manual bookkeeping.
 */
async function autoMatchExpense(params: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  orgId: string;
  expenseId: string;
  merchant: string;
  amount: number;
  spentAt: string;
}) {
  const { supabase, orgId, expenseId, merchant, amount, spentAt } = params;

  const spent = new Date(spentAt);
  const windowStart = new Date(spent);
  windowStart.setDate(windowStart.getDate() - 5);
  const windowEnd = new Date(spent);
  windowEnd.setDate(windowEnd.getDate() + 5);

  const { data: candidates } = await supabase
    .from("transactions")
    .select("id, merchant, amount, occurred_at, status")
    .eq("org_id", orgId)
    .in("status", ["pending", "posted"])
    .gte("occurred_at", windowStart.toISOString())
    .lte("occurred_at", windowEnd.toISOString())
    .gte("amount", amount - 0.01)
    .lte("amount", amount + 0.01);

  const match = (candidates ?? []).find((t) =>
    t.merchant.toLowerCase().includes(merchant.toLowerCase().slice(0, 4))
  );

  if (!match) return false;

  await supabase
    .from("expenses")
    .update({ matched_transaction_id: match.id })
    .eq("id", expenseId);

  await supabase
    .from("transactions")
    .update({ status: "matched" })
    .eq("id", match.id);

  return true;
}

export async function createExpense(
  _prev: ExpenseFormState,
  formData: FormData
): Promise<ExpenseFormState> {
  const { organization, membership } = await requireOrgContext();
  const supabase = await createClient();

  const merchant = String(formData.get("merchant") ?? "").trim();
  const amount = Number(formData.get("amount"));
  const categoryId = String(formData.get("category_id") ?? "") || null;
  const description = String(formData.get("description") ?? "").trim() || null;
  const spentAt = String(formData.get("spent_at") ?? "");
  const submitNow = formData.get("intent") === "submit";
  const receipt = formData.get("receipt") as File | null;

  if (!merchant) return { error: "Add a merchant name." };
  if (!amount || amount <= 0) return { error: "Enter an amount greater than zero." };
  if (!spentAt) return { error: "Add the date you spent this." };

  let receiptPath: string | null = null;

  if (receipt && receipt.size > 0) {
    const ext = receipt.name.split(".").pop() ?? "jpg";
    const path = `${organization.id}/${membership.id}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("receipts")
      .upload(path, receipt, { contentType: receipt.type });

    if (uploadError) {
      return { error: "Couldn't upload that receipt. Try a smaller file." };
    }
    receiptPath = path;
  }

  const { data: inserted, error } = await supabase
    .from("expenses")
    .insert({
      org_id: organization.id,
      submitted_by: membership.id,
      category_id: categoryId,
      merchant,
      description,
      amount,
      currency: organization.default_currency,
      spent_at: spentAt,
      status: submitNow ? "submitted" : "draft",
      submitted_at: submitNow ? new Date().toISOString() : null,
      receipt_path: receiptPath,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return { error: "Something went wrong saving that expense. Please try again." };
  }

  if (submitNow) {
    await autoMatchExpense({
      supabase,
      orgId: organization.id,
      expenseId: inserted.id,
      merchant,
      amount,
      spentAt,
    });

    await logAuditEvent({
      supabase,
      orgId: organization.id,
      actorId: membership.id,
      action: "expense.submitted",
      entityType: "expense",
      entityId: inserted.id,
      metadata: { merchant, amount },
    });
  }

  revalidatePath("/expenses");
  redirect("/expenses");
}

export async function deleteDraftExpense(expenseId: string) {
  const { organization, membership } = await requireOrgContext();
  const supabase = await createClient();

  await supabase
    .from("expenses")
    .delete()
    .eq("id", expenseId)
    .eq("org_id", organization.id)
    .eq("submitted_by", membership.id)
    .eq("status", "draft");

  revalidatePath("/expenses");
}

export async function submitDraftExpense(expenseId: string) {
  const { organization, membership } = await requireOrgContext();
  const supabase = await createClient();

  const { data: expense } = await supabase
    .from("expenses")
    .select("id, merchant, amount, spent_at")
    .eq("id", expenseId)
    .eq("org_id", organization.id)
    .eq("submitted_by", membership.id)
    .single();

  if (!expense) return;

  await supabase
    .from("expenses")
    .update({ status: "submitted", submitted_at: new Date().toISOString() })
    .eq("id", expenseId);

  await autoMatchExpense({
    supabase,
    orgId: organization.id,
    expenseId: expense.id,
    merchant: expense.merchant,
    amount: expense.amount,
    spentAt: expense.spent_at,
  });

  await logAuditEvent({
    supabase,
    orgId: organization.id,
    actorId: membership.id,
    action: "expense.submitted",
    entityType: "expense",
    entityId: expense.id,
  });

  revalidatePath("/expenses");
}
