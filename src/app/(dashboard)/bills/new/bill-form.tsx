"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Upload } from "lucide-react";
import { createBill, type BillFormState } from "../actions";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

const initialState: BillFormState = {};

export function NewBillForm({
  categories,
}: {
  categories: { id: string; name: string }[];
}) {
  const [state, formAction] = useActionState(createBill, initialState);
  const [fileName, setFileName] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Vendor" htmlFor="vendor_name">
          <Input id="vendor_name" name="vendor_name" required />
        </Field>
        <Field label="Invoice number" htmlFor="invoice_number" hint="Optional">
          <Input id="invoice_number" name="invoice_number" />
        </Field>
        <Field label="Amount" htmlFor="bill_amount">
          <Input id="bill_amount" name="amount" type="number" min="0.01" step="0.01" required />
        </Field>
        <Field label="Category" htmlFor="bill_category">
          <Select id="bill_category" name="category_id" defaultValue="">
            <option value="">Uncategorized</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Issue date" htmlFor="issue_date">
          <Input id="issue_date" name="issue_date" type="date" defaultValue={today} required />
        </Field>
        <Field label="Due date" htmlFor="due_date" hint="Optional">
          <Input id="due_date" name="due_date" type="date" />
        </Field>
      </div>

      <Field label="Notes" htmlFor="notes" hint="Optional">
        <Textarea id="notes" name="notes" rows={3} />
      </Field>

      <div>
        <label
          htmlFor="file"
          className="flex cursor-pointer items-center gap-3 rounded-md border border-dashed border-line bg-paper-50 px-4 py-3 text-sm text-ink-700 hover:border-brass-500"
        >
          <Upload className="h-4 w-4 text-ink-600" />
          {fileName ?? "Attach the invoice (PDF, JPG, or PNG)"}
        </label>
        <input
          id="file"
          name="file"
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
        />
      </div>

      {state.error && (
        <p className="rounded-md bg-danger-100 px-3 py-2 text-sm text-danger-600">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <SubmitButton intent="submit" label="Send for approval" />
        <SubmitButton intent="draft" label="Save as draft" variant="secondary" />
      </div>
    </form>
  );
}

function SubmitButton({
  intent,
  label,
  variant = "primary",
}: {
  intent: "submit" | "draft";
  label: string;
  variant?: "primary" | "secondary";
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" name="intent" value={intent} variant={variant} disabled={pending}>
      {pending ? "Saving…" : label}
    </Button>
  );
}
