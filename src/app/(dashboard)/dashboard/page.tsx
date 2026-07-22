import Link from "next/link";
import { Receipt, CheckSquare, Users, TrendingUp } from "lucide-react";
import { requireOrgContext, hasRole } from "@/lib/data/org-context";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function DashboardOverviewPage() {
  const { organization, membership } = await requireOrgContext();
  const isManagerOrAdmin = hasRole(membership.role, "manager");
  const supabase = await createClient();

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [pendingExpensesQ, myExpensesQ, monthSpendQ, membersQ, recentQ] = await Promise.all([
    supabase
      .from("expenses")
      .select("id", { count: "exact", head: true })
      .eq("org_id", organization.id)
      .eq("status", "submitted"),
    supabase
      .from("expenses")
      .select("id", { count: "exact", head: true })
      .eq("org_id", organization.id)
      .eq("submitted_by", membership.id)
      .in("status", ["draft", "submitted"]),
    supabase
      .from("expenses")
      .select("amount")
      .eq("org_id", organization.id)
      .in("status", ["approved", "reimbursed"])
      .gte("spent_at", monthStart.toISOString().slice(0, 10)),
    supabase
      .from("org_members")
      .select("id", { count: "exact", head: true })
      .eq("org_id", organization.id)
      .eq("is_active", true),
    supabase
      .from("expenses")
      .select("id, merchant, amount, currency, status, spent_at, submitter:org_members!expenses_submitted_by_fkey(full_name)")
      .eq("org_id", organization.id)
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const monthTotal = (monthSpendQ.data ?? []).reduce((sum, r) => sum + Number(r.amount), 0);

  const stats = [
    isManagerOrAdmin
      ? {
          label: "Awaiting approval",
          value: pendingExpensesQ.count ?? 0,
          icon: CheckSquare,
          href: "/approvals",
        }
      : {
          label: "Your open expenses",
          value: myExpensesQ.count ?? 0,
          icon: Receipt,
          href: "/expenses",
        },
    {
      label: "Approved spend this month",
      value: formatCurrency(monthTotal, organization.default_currency),
      icon: TrendingUp,
      href: "/reports",
    },
    {
      label: "Active teammates",
      value: membersQ.count ?? 0,
      icon: Users,
      href: "/team",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardContent className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-ink-600">
                    {stat.label}
                  </p>
                  <p className="mt-1 font-ledger text-2xl font-semibold text-ink-950">
                    {stat.value}
                  </p>
                </div>
                <div className="rounded-full bg-brass-100 p-2 text-brass-600">
                  <stat.icon className="h-4 w-4" strokeWidth={1.75} />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <Link href="/expenses">
            <Button size="sm" variant="ghost">
              View all
            </Button>
          </Link>
        </CardHeader>
        {(recentQ.data ?? []).length === 0 ? (
          <CardContent>
            <p className="py-6 text-center text-sm text-ink-600">
              Nothing submitted yet — get started with your first expense.
            </p>
            <div className="flex justify-center">
              <Link href="/expenses/new">
                <Button size="sm">New expense</Button>
              </Link>
            </div>
          </CardContent>
        ) : (
          <ul className="divide-y divide-line">
            {(recentQ.data ?? []).map((row) => (
              <li key={row.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <div>
                  <p className="font-medium text-ink-950">{row.merchant}</p>
                  <p className="text-xs text-ink-600">
                    {(row.submitter as unknown as { full_name: string } | null)?.full_name ?? "—"} ·{" "}
                    {formatDate(row.spent_at)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusPill status={row.status} />
                  <span className="font-ledger font-medium text-ink-950">
                    {formatCurrency(row.amount, row.currency)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
