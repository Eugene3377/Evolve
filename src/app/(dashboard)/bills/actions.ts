"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireOrgContext, assertRole } from "@/lib/data/org-context";
import { logAuditEvent } from "@/lib/data/audit";

export interface BillFormState {
  error?: string;
}

export async function createBill(
  _prev: BillFormState,
  formData: FormData
): Promise<BillFormState> {
  const { organization, membership } = await requireOrgContext();
  assertRole(membership.role, "manager");
  const supabase = await createClient();

  const vendorName = String(formData.get("vendor_name") ?? "").trim();
  const invoiceNumber = String(formData.get("invoice_number") ?? "").trim() || null;
  const amount = Number(formData.get("amount"));
  const issueDate = String(formData.get("issue_date") ?? "");
  const dueDate = String(formData.get("due_date") ?? "") || null;
  const categoryId = String(formData.get("category_id") ?? "") || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const sendForApproval = formData.get("intent") === "submit";
  const file = formData.get("file") as File | null;

  if (!vendorName) return { error: "Add a vendor name." };
  if (!amount || amount <= 0) return { error: "Enter an amount greater than zero." };
  if (!issueDate) return { error: "Add an issue date." };

  let filePath: string | null = null;
  if (file && file.size > 0) {
    const ext = file.name.split(".").pop() ?? "pdf";
    const path = `${organization.id}/bills/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("invoices")
      .upload(path, file, { contentType: file.type });
    if (uploadError) return { error: "Couldn't upload that file. Try again." };
    filePath = path;
  }

  const { data: inserted, error } = await supabase
    .from("bills")
    .insert({
      org_id: organization.id,
      created_by: membership.id,
      vendor_name: vendorName,
      invoice_number: invoiceNumber,
      amount,
      currency: organization.default_currency,
      issue_date: issueDate,
      due_date: dueDate,
      category_id: categoryId,
      notes,
      file_path: filePath,
      status: sendForApproval ? "awaiting_approval" : "draft",
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return { error: "Something went wrong saving that bill. Please try again." };
  }

  await logAuditEvent({
    supabase,
    orgId: organization.id,
    actorId: membership.id,
    action: sendForApproval ? "bill.submitted" : "bill.created",
    entityType: "bill",
    entityId: inserted.id,
    metadata: { vendorName, amount },
  });

  revalidatePath("/bills");
  redirect("/bills");
}

export async function markBillPaid(billId: string) {
  const { organization, membership } = await requireOrgContext();
  assertRole(membership.role, "manager");
  const supabase = await createClient();

  await supabase
    .from("bills")
    .update({ status: "paid" })
    .eq("id", billId)
    .eq("org_id", organization.id);

  await logAuditEvent({
    supabase,
    orgId: organization.id,
    actorId: membership.id,
    action: "bill.paid",
    entityType: "bill",
    entityId: billId,
  });

  revalidatePath("/bills");
}
