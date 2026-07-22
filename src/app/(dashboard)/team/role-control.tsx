"use client";

import { useTransition } from "react";
import { Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { updateMemberRole, removeMember } from "./actions";
import type { OrgRole } from "@/types/domain";

export function RoleControl({
  memberId,
  role,
  isSelf,
}: {
  memberId: string;
  role: OrgRole;
  isSelf: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <Select
        defaultValue={role}
        disabled={isSelf || pending}
        onChange={(e) =>
          startTransition(() => updateMemberRole(memberId, e.target.value as OrgRole))
        }
        className="h-8 w-32 py-1 text-xs"
      >
        <option value="employee">Employee</option>
        <option value="manager">Manager</option>
        <option value="admin">Admin</option>
      </Select>
      {!isSelf && (
        <Button
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={() => startTransition(() => removeMember(memberId))}
        >
          Remove
        </Button>
      )}
    </div>
  );
}
