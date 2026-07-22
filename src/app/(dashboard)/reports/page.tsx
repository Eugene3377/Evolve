import { redirect } from "next/navigation";
import { requireOrgContext, hasRole } from "@/lib/data/org-context";
import { getSpendSummary } from "@/lib/data/reports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { CategoryBarChart, MonthlyTrendChart } from "@/components/reports/spend-charts";

export default async function ReportsPage() {
  const { organization, membership } = await requireOrgContext();
  if (!hasRole(membership.role, "manager")) redirect("/dashboard");

  const summary = await getSpendSummary(organization.id, 6);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-ink-600">
              Approved spend (6 mo)
            </p>
            <p className="font-ledger text-2xl font-semibold text-ink-950">
              {formatCurrency(summary.total, organization.default_currency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-ink-600">
              Approved expenses
            </p>
            <p className="font-ledger text-2xl font-semibold text-ink-950">
              {summary.count}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-ink-600">
              Top category
            </p>
            <p className="text-2xl font-semibold text-ink-950">
              {summary.categories[0]?.name ?? "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Spend over time</CardTitle>
        </CardHeader>
        <CardContent>
          {summary.monthly.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-600">
              No approved spend yet in this window.
            </p>
          ) : (
            <MonthlyTrendChart data={summary.monthly} />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>By category</CardTitle>
          </CardHeader>
          <CardContent>
            {summary.categories.length === 0 ? (
              <p className="py-8 text-center text-sm text-ink-600">Nothing to show yet.</p>
            ) : (
              <CategoryBarChart data={summary.categories} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>By team member</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {summary.members.length === 0 ? (
              <p className="py-8 text-center text-sm text-ink-600">Nothing to show yet.</p>
            ) : (
              <ul className="divide-y divide-line">
                {summary.members.map((m) => (
                  <li key={m.name} className="flex items-center justify-between px-5 py-3 text-sm">
                    <span className="text-ink-800">{m.name}</span>
                    <span className="font-ledger font-medium text-ink-950">
                      {formatCurrency(m.total, organization.default_currency)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
