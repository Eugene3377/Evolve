import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { OrgMember } from "@/types/domain";

export async function listMembers(orgId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("org_members")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as OrgMember[];
}

export async function listInvites(orgId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("org_invites")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
