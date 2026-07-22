import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Transaction, TxnStatus } from "@/types/domain";

export async function listTransactions({
  orgId,
  status,
}: {
  orgId: string;
  status?: TxnStatus;
}) {
  const supabase = await createClient();
  let query = supabase
    .from("transactions")
    .select(
      "*, category:categories(id, name, icon), member:org_members(id, full_name)"
    )
    .eq("org_id", orgId)
    .order("occurred_at", { ascending: false })
    .limit(200);

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as Transaction[];
}
