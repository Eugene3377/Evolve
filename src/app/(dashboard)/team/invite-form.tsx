"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { inviteMember, type InviteFormState } from "./actions";
import { Field, Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import type { OrgRole } from "@/types/domain";

const initialState: InviteFormState = {};

export function InviteForm({ canInviteAdmin }: { canInviteAdmin: boolean }) {
  const [state, formAction] = useActionState(inviteMember, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="min-w-[220px] flex-1">
        <Field label="Email address" htmlFor="invite_email">
          <Input
            id="invite_email"
            name="email"
            type="email"
            placeholder="teammate@company.com"
            required
          />
        </Field>
      </div>
      <div className="w-36">
        <Field label="Role" htmlFor="invite_role">
          <Select id="invite_role" name="role" defaultValue={"employee" satisfies OrgRole}>
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
            {canInviteAdmin && <option value="admin">Admin</option>}
          </Select>
        </Field>
      </div>
      <SubmitButton />
      {state.error && (
        <p className="w-full text-sm text-danger-600">{state.error}</p>
      )}
      {state.success && (
        <p className="w-full text-sm text-positive-600">{state.success}</p>
      )}
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Sending…" : "Send invite"}
    </Button>
  );
}
