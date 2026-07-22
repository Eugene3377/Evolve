"use client";

import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Upload } from "lucide-react";
import { createExpense, type ExpenseFormState } from "../actions";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

const initialState: ExpenseFormState = {};

export function NewExpenseForm({
  categories,
}: {
  categories: { id: string; name: string }[];
}) {
  const [state, formAction] = useActionState(createExpense, initialState);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Merchant" htmlFor="merchant">
          <Input
            id="merchant"
            name="merchant"
            placeholder="e.g. Delta Airlines"
            required
          />
        </Field>
        <Field label="Amount" htmlFor="amount">
          <Input
            id="amount"
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            required
          />
        </Field>
        <Field label="Category" htmlFor="category_id">
          <Select id="category_id" name="category_id" defaultValue="">
            <option value="">Uncategorized</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Date spent" htmlFor="spent_at">
          <Input
            id="spent_at"
            name="spent_at"
            type="date"
            defaultValue={today}
            max={today}
            required
          />
        </Field>
      </div>

      <Field label="Description" htmlFor="description" hint="Optional — helps your approver understand the spend.">
        <Textarea
          id="description"
          name="description"
          rows={3}
          placeholder="What was this for?"
        />
      </Field>

      <div>
        <label
          htmlFor="receipt"
          className="flex cursor-pointer items-center gap-3 rounded-md border border-dashed border-line bg-paper-50 px-4 py-3 text-sm text-ink-700 hover:border-brass-500"
        >
          <Upload className="h-4 w-4 text-ink-600" />
          {fileName ?? "Attach a receipt (PDF, JPG, or PNG)"}
        </label>
        <input
          ref={fileInput}
          id="receipt"
          name="receipt"
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
        <SubmitButton intent="submit" label="Submit for approval" />
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
    <Button
      type="submit"
      name="intent"
      value={intent}
      variant={variant}
      disabled={pending}
    >
      {pending ? "Saving…" : label}
    </Button>
  );
}
