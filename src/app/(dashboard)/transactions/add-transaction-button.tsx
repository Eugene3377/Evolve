"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Plus, X } from "lucide-react";
import { recordTransaction, type TxnFormState } from "./actions";
import { Field, Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

const initialState: TxnFormState = {};

export function AddTransactionButton({
  categories,
}: {
  categories: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(recordTransaction, initialState);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Record transaction
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink-950">
                Record a transaction
              </h3>
              <button onClick={() => setOpen(false)} className="text-ink-600 hover:text-ink-950">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form action={formAction} className="space-y-4">
              <Field label="Merchant" htmlFor="txn_merchant">
                <Input id="txn_merchant" name="merchant" required />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Amount" htmlFor="txn_amount">
                  <Input
                    id="txn_amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    required
                  />
                </Field>
                <Field label="Date" htmlFor="txn_date">
                  <Input
                    id="txn_date"
                    name="occurred_at"
                    type="date"
                    defaultValue={today}
                    required
                  />
                </Field>
              </div>
              <Field label="Category" htmlFor="txn_category">
                <Select id="txn_category" name="category_id" defaultValue="">
                  <option value="">Uncategorized</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
              {state.error && (
                <p className="rounded-md bg-danger-100 px-3 py-2 text-sm text-danger-600">
                  {state.error}
                </p>
              )}
              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <SubmitButton />
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save transaction"}
    </Button>
  );
}
