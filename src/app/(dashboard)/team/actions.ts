"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireOrgContext, assertRole } from "@/lib/data/org-context";
import { logAuditEvent } from "@/lib/data/audit";
import type { OrgRole } from "@/types/domain";

export interface InviteFormState {
  error?: string;
  success?: string;
}

export async function inviteMember(
  _prev: InviteFormState,
  formData: FormData
): Promise<InviteFormState> {
  const { organization, membership } = await requireOrgContext();
  assertRole(membership.role, "manager");
  const supabase = await createClient();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "employee") as OrgRole;

  if (!email || !email.includes("@")) return { error: "Enter a valid email address." };
  if (role === "admin" && membership.role !== "admin") {
    return { error: "Only admins can invite other admins." };
  }

  const { data: invite, error } = await supabase
    .from("org_invites")
    .insert({
      org_id: organization.id,
      email,
      role,
      invited_by: membership.id,
    })
    .select("id, token")
    .single();

  if (error || !invite) {
    return { error: "That person may already have a pending invite." };
  }

  // Hand off delivery to an Edge Function so the anon-key client never
  // needs an email-provider secret. Failure to send shouldn't block the
  // invite from existing — an admin can resend it from the roster.
  const { error: fnError } = await supabase.functions.invoke("invite-member", {
    body: {
      invite_id: invite.id,
      email,
      org_name: organization.name,
      token: invite.token,
    },
  });
  if (fnError) {
    console.error("invite-member function failed", fnError);
  }

  await logAuditEvent({
    supabase,
    orgId: organization.id,
    actorId: membership.id,
    action: "member.invited",
    entityType: "org_invite",
    entityId: invite.id,
    metadata: { email, role },
  });

  revalidatePath("/team");
  return { success: `Invite sent to ${email}.` };
}

export async function revokeInvite(inviteId: string) {
  const { organization, membership } = await requireOrgContext();
  assertRole(membership.role, "manager");
  const supabase = await createClient();

  await supabase
    .from("org_invites")
    .update({ status: "revoked" })
    .eq("id", inviteId)
    .eq("org_id", organization.id);

  await logAuditEvent({
    supabase,
    orgId: organization.id,
    actorId: membership.id,
    action: "invite.revoked",
    entityType: "org_invite",
    entityId: inviteId,
  });

  revalidatePath("/team");
}

export async function updateMemberRole(memberId: string, role: OrgRole) {
  const { organization, membership } = await requireOrgContext();
  assertRole(membership.role, "admin");
  const supabase = await createClient();

  await supabase
    .from("org_members")
    .update({ role })
    .eq("id", memberId)
    .eq("org_id", organization.id);

  await logAuditEvent({
    supabase,
    orgId: organization.id,
    actorId: membership.id,
    action: "member.role_changed",
    entityType: "org_member",
    entityId: memberId,
    metadata: { role },
  });

  revalidatePath("/team");
}

export async function removeMember(memberId: string) {
  const { organization, membership } = await requireOrgContext();
  assertRole(membership.role, "admin");
  const supabase = await createClient();

  await supabase
    .from("org_members")
    .update({ is_active: false })
    .eq("id", memberId)
    .eq("org_id", organization.id);

  await logAuditEvent({
    supabase,
    orgId: organization.id,
    actorId: membership.id,
    action: "member.removed",
    entityType: "org_member",
    entityId: memberId,
  });

  revalidatePath("/team");
}
