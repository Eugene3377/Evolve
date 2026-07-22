import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { OrgContext, OrgRole } from "@/types/domain";

/**
 * Resolves the signed-in user, their organization, and their membership
 * row. Redirects to /login if unauthenticated, or /onboarding if the user
 * has no organization yet. Use this at the top of every dashboard page.
 */
export async function requireOrgContext(): Promise<OrgContext> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membership } = await supabase
    .from("org_members")
    .select("*, organizations(*)")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (!membership) {
    redirect("/onboarding");
  }

  const { organizations, ...member } = membership as never as {
    organizations: OrgContext["organization"];
  } & OrgContext["membership"];

  return { organization: organizations, membership: member };
}

const ROLE_RANK: Record<OrgRole, number> = {
  employee: 0,
  manager: 1,
  admin: 2,
};

export function hasRole(role: OrgRole, minimum: OrgRole) {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

/** Throws-away guard for server actions — call before mutating. */
export function assertRole(role: OrgRole, minimum: OrgRole) {
  if (!hasRole(role, minimum)) {
    throw new Error("You don't have permission to do that.");
  }
}
