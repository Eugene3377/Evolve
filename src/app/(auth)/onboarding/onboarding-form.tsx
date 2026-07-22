"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createOrganization, type OnboardingState } from "./actions";
import { Field, Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

const initialState: OnboardingState = {};

export function OnboardingForm({ defaultName }: { defaultName: string }) {
  const [state, formAction] = useActionState(createOrganization, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Your name" htmlFor="full_name">
        <Input id="full_name" name="full_name" defaultValue={defaultName} required />
      </Field>
      <Field label="Organization name" htmlFor="org_name" hint="You can change this later.">
        <Input id="org_name" name="org_name" placeholder="Acme Inc." required />
      </Field>
      <Field label="Default currency" htmlFor="currency">
        <Select id="currency" name="currency" defaultValue="USD">
          <option value="USD">USD — US Dollar</option>
          <option value="EUR">EUR — Euro</option>
          <option value="GBP">GBP — British Pound</option>
          <option value="GHS">GHS — Ghanaian Cedi</option>
          <option value="CAD">CAD — Canadian Dollar</option>
          <option value="AUD">AUD — Australian Dollar</option>
        </Select>
      </Field>

      {state.error && (
        <p className="rounded-md bg-danger-100 px-3 py-2 text-sm text-danger-600">
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Setting up…" : "Create workspace"}
    </Button>
  );
}
