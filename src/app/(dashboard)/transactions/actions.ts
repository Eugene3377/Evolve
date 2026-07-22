"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireOrgContext, assertRole } from "@/lib/data/org-context";
import { logAuditEvent } from "@/lib/data/audit";

export interface TxnFormState {
  error?: string;
}

export async function recordTransaction(
  _prev: TxnFormState,
  formData: FormData
): Promise<TxnFormState> {
  const { organization, membership } = await requireOrgContext();
  assertRole(membership.role, "manager");
  const supabase = await createClient();

  const merchant = String(formData.get("merchant") ?? "").trim();
  const amount = Number(formData.get("amount"));
  const occurredAt = String(formData.get("occurred_at") ?? "");
  const categoryId = String(formData.get("category_id") ?? "") || null;

  if (!merchant) return { error: "Add a merchant name." };
  if (!amount) return { error: "Enter a nonzero amount." };
  if (!occurredAt) return { error: "Add a date." };

  const { data: inserted, error } = await supabase
    .from("transactions")
    .insert({
      org_id: organization.id,
      merchant,
      amount,
      currency: organization.default_currency,
      occurred_at: new Date(occurredAt).toISOString(),
      category_id: categoryId,
      status: "posted",
      source: "manual",
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return { error: "Couldn't save that transaction. Please try again." };
  }

  await logAuditEvent({
    supabase,
    orgId: organization.id,
    actorId: membership.id,
    action: "transaction.recorded",
    entityType: "transaction",
    entityId: inserted.id,
    metadata: { merchant, amount },
  });

  revalidatePath("/transactions");
  return {};
}
