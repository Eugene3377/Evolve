"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireOrgContext, assertRole } from "@/lib/data/org-context";
import { logAuditEvent } from "@/lib/data/audit";

export async function updateOrganization(formData: FormData) {
  const { organization, membership } = await requireOrgContext();
  assertRole(membership.role, "admin");
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const currency = String(formData.get("default_currency") ?? "USD").trim().toUpperCase();
  if (!name) return;

  await supabase
    .from("organizations")
    .update({ name, default_currency: currency })
    .eq("id", organization.id);

  await logAuditEvent({
    supabase,
    orgId: organization.id,
    actorId: membership.id,
    action: "organization.updated",
    entityType: "organization",
    entityId: organization.id,
    metadata: { name, currency },
  });

  revalidatePath("/settings");
}

export async function addCategory(formData: FormData) {
  const { organization, membership } = await requireOrgContext();
  assertRole(membership.role, "manager");
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  await supabase.from("categories").insert({ org_id: organization.id, name });
  revalidatePath("/settings");
}

export async function archiveCategory(categoryId: string) {
  const { organization, membership } = await requireOrgContext();
  assertRole(membership.role, "manager");
  const supabase = await createClient();

  await supabase
    .from("categories")
    .update({ is_archived: true })
    .eq("id", categoryId)
    .eq("org_id", organization.id);

  revalidatePath("/settings");
}
