import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Expense, ExpenseStatus } from "@/types/domain";

export async function listExpenses({
  orgId,
  memberId,
  isManagerOrAdmin,
  status,
}: {
  orgId: string;
  memberId: string;
  isManagerOrAdmin: boolean;
  status?: ExpenseStatus;
}) {
  const supabase = await createClient();

  let query = supabase
    .from("expenses")
    .select(
      "*, category:categories(id, name, icon), submitter:org_members!expenses_submitted_by_fkey(id, full_name)"
    )
    .eq("org_id", orgId)
    .order("spent_at", { ascending: false });

  if (!isManagerOrAdmin) {
    query = query.eq("submitted_by", memberId);
  }
  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as Expense[];
}

export async function getExpense(orgId: string, expenseId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select(
      "*, category:categories(id, name, icon), submitter:org_members!expenses_submitted_by_fkey(id, full_name)"
    )
    .eq("org_id", orgId)
    .eq("id", expenseId)
    .maybeSingle();

  if (error) throw error;
  return data as unknown as Expense | null;
}

export async function listCategories(orgId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, icon")
    .eq("org_id", orgId)
    .eq("is_archived", false)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function receiptSignedUrl(path: string) {
  const supabase = await createClient();
  const { data } = await supabase.storage
    .from("receipts")
    .createSignedUrl(path, 60 * 10);
  return data?.signedUrl ?? null;
}
