"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/data/audit";
import { slugify } from "@/lib/utils";

export interface OnboardingState {
  error?: string;
}

const DEFAULT_CATEGORIES = [
  "Travel",
  "Meals & entertainment",
  "Software",
  "Office supplies",
  "Marketing",
];

export async function createOrganization(
  _prev: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Your session expired — please sign in again." };

  const orgName = String(formData.get("org_name") ?? "").trim();
  const fullName =
    String(formData.get("full_name") ?? "").trim() ||
    (user.user_metadata?.full_name as string | undefined) ||
    user.email!.split("@")[0];
  const currency = String(formData.get("currency") ?? "USD");

  if (!orgName) return { error: "Give your organization a name." };

  const baseSlug = slugify(orgName) || "org";
  const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({
      name: orgName,
      slug,
      default_currency: currency,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (orgError || !org) {
    return { error: "Couldn't create your organization. Please try again." };
  }

  const { data: member, error: memberError } = await supabase
    .from("org_members")
    .insert({
      org_id: org.id,
      user_id: user.id,
      role: "admin",
      full_name: fullName,
    })
    .select("id")
    .single();

  if (memberError || !member) {
    return { error: "Couldn't finish setting up your account. Please try again." };
  }

  await supabase
    .from("categories")
    .insert(DEFAULT_CATEGORIES.map((name) => ({ org_id: org.id, name })));

  await logAuditEvent({
    supabase,
    orgId: org.id,
    actorId: member.id,
    action: "organization.created",
    entityType: "organization",
    entityId: org.id,
    metadata: { name: orgName },
  });

  redirect("/dashboard");
}
