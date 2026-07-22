import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Bill, Expense } from "@/types/domain";

export async function listPendingExpenses(orgId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select(
      "*, category:categories(id, name, icon), submitter:org_members!expenses_submitted_by_fkey(id, full_name)"
    )
    .eq("org_id", orgId)
    .eq("status", "submitted")
    .order("submitted_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as Expense[];
}

export async function listPendingBills(orgId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bills")
    .select("*, category:categories(id, name, icon)")
    .eq("org_id", orgId)
    .eq("status", "awaiting_approval")
    .order("due_date", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as Bill[];
}
