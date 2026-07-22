import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { AuditLog } from "@/types/domain";

export async function listAuditLogs(orgId: string, limit = 100) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*, actor:org_members(id, full_name)")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as AuditLog[];
}
