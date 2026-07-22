import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Bill, BillStatus } from "@/types/domain";

export async function listBills(orgId: string, status?: BillStatus) {
  const supabase = await createClient();
  let query = supabase
    .from("bills")
    .select("*, category:categories(id, name, icon)")
    .eq("org_id", orgId)
    .order("due_date", { ascending: true });

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as Bill[];
}

export async function billFileSignedUrl(path: string) {
  const supabase = await createClient();
  const { data } = await supabase.storage
    .from("invoices")
    .createSignedUrl(path, 60 * 10);
  return data?.signedUrl ?? null;
}
