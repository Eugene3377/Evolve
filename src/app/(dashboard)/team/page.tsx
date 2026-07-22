import { redirect } from "next/navigation";
import { requireOrgContext, hasRole } from "@/lib/data/org-context";
import { listMembers, listInvites } from "@/lib/data/team";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, RoleBadge } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { InviteForm } from "./invite-form";
import { RoleControl } from "./role-control";
import { revokeInvite } from "./actions";

export default async function TeamPage() {
  const { organization, membership } = await requireOrgContext();
  if (!hasRole(membership.role, "manager")) redirect("/dashboard");

  const isAdmin = membership.role === "admin";
  const [members, invites] = await Promise.all([
    listMembers(organization.id),
    listInvites(organization.id),
  ]);
  const pendingInvites = invites.filter((i) => i.status === "pending");

  async function revokeAction(formData: FormData) {
    "use server";
    await revokeInvite(String(formData.get("invite_id")));
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Invite a teammate</CardTitle>
        </CardHeader>
        <CardContent>
          <InviteForm canInviteAdmin={isAdmin} />
        </CardContent>
      </Card>

      {pendingInvites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending invites ({pendingInvites.length})</CardTitle>
          </CardHeader>
          <ul className="divide-y divide-line">
            {pendingInvites.map((invite) => (
              <li key={invite.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-ink-950">{invite.email}</p>
                  <p className="text-xs text-ink-600">
                    Invited {formatDate(invite.created_at)} · expires{" "}
                    {formatDate(invite.expires_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <RoleBadge role={invite.role} />
                  <form action={revokeAction}>
                    <input type="hidden" name="invite_id" value={invite.id} />
                    <Button size="sm" variant="ghost" type="submit">
                      Revoke
                    </Button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>People ({members.length})</CardTitle>
        </CardHeader>
        <ul className="divide-y divide-line">
          {members.map((member) => (
            <li key={member.id} className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-3">
                <Avatar name={member.full_name} />
                <div>
                  <p className="text-sm font-medium text-ink-950">
                    {member.full_name ?? "Unnamed teammate"}
                  </p>
                  <p className="text-xs text-ink-600">{member.title ?? "—"}</p>
                </div>
              </div>
              {isAdmin ? (
                <RoleControl
                  memberId={member.id}
                  role={member.role}
                  isSelf={member.id === membership.id}
                />
              ) : (
                <RoleBadge role={member.role} />
              )}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
