"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireOrgContext, assertRole } from "@/lib/data/org-context";
import { logAuditEvent } from "@/lib/data/audit";

export async function decideExpense(formData: FormData) {
  const { organization, membership } = await requireOrgContext();
  assertRole(membership.role, "manager");
  const supabase = await createClient();

  const expenseId = String(formData.get("expense_id"));
  const decision = String(formData.get("decision")) as "approved" | "rejected";
  const reason = String(formData.get("reason") ?? "").trim() || null;

  await supabase
    .from("expenses")
    .update({
      status: decision,
      decided_at: new Date().toISOString(),
      decided_by: membership.id,
      rejection_reason: decision === "rejected" ? reason : null,
    })
    .eq("id", expenseId)
    .eq("org_id", organization.id);

  await supabase.from("approvals").insert({
    org_id: organization.id,
    subject_type: "expense",
    subject_id: expenseId,
    approver_id: membership.id,
    status: decision,
    comment: reason,
    decided_at: new Date().toISOString(),
  });

  await logAuditEvent({
    supabase,
    orgId: organization.id,
    actorId: membership.id,
    action: `expense.${decision}`,
    entityType: "expense",
    entityId: expenseId,
    metadata: reason ? { reason } : undefined,
  });

  revalidatePath("/approvals");
  revalidatePath("/expenses");
}

export async function decideBill(formData: FormData) {
  const { organization, membership } = await requireOrgContext();
  assertRole(membership.role, "manager");
  const supabase = await createClient();

  const billId = String(formData.get("bill_id"));
  const decision = String(formData.get("decision")) as "approved" | "void";

  await supabase
    .from("bills")
    .update({ status: decision })
    .eq("id", billId)
    .eq("org_id", organization.id);

  await supabase.from("approvals").insert({
    org_id: organization.id,
    subject_type: "bill",
    subject_id: billId,
    approver_id: membership.id,
    status: decision === "approved" ? "approved" : "rejected",
    decided_at: new Date().toISOString(),
  });

  await logAuditEvent({
    supabase,
    orgId: organization.id,
    actorId: membership.id,
    action: `bill.${decision}`,
    entityType: "bill",
    entityId: billId,
  });

  revalidatePath("/approvals");
  revalidatePath("/bills");
}
