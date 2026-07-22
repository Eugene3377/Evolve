import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface SpendByCategory {
  name: string;
  total: number;
}

export interface SpendByMonth {
  month: string;
  total: number;
}

export interface SpendByTeamMember {
  name: string;
  total: number;
}

/**
 * Pulls approved + reimbursed expenses for the org over the given number
 * of months and reduces them client-side (server component) into the
 * summaries the reporting dashboard needs. At Evolve's current scale this
 * keeps the SQL simple; a `spend_by_category` materialized view is a
 * natural next step once org sizes grow.
 */
export async function getSpendSummary(orgId: string, months = 6) {
  const supabase = await createClient();
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const { data, error } = await supabase
    .from("expenses")
    .select(
      "amount, spent_at, category:categories(name), submitter:org_members!expenses_submitted_by_fkey(full_name)"
    )
    .eq("org_id", orgId)
    .in("status", ["approved", "reimbursed"])
    .gte("spent_at", since.toISOString().slice(0, 10));

  if (error) throw error;

  const rows = (data ?? []) as unknown as {
    amount: number;
    spent_at: string;
    category: { name: string } | null;
    submitter: { full_name: string | null } | null;
  }[];

  const byCategory = new Map<string, number>();
  const byMonth = new Map<string, number>();
  const byMember = new Map<string, number>();
  let total = 0;

  for (const row of rows) {
    total += row.amount;

    const cat = row.category?.name ?? "Uncategorized";
    byCategory.set(cat, (byCategory.get(cat) ?? 0) + row.amount);

    const month = new Date(row.spent_at).toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    });
    byMonth.set(month, (byMonth.get(month) ?? 0) + row.amount);

    const member = row.submitter?.full_name ?? "Unknown";
    byMember.set(member, (byMember.get(member) ?? 0) + row.amount);
  }

  const categories: SpendByCategory[] = [...byCategory.entries()]
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total);

  const monthly: SpendByMonth[] = [...byMonth.entries()].map(([month, total]) => ({
    month,
    total,
  }));

  const members: SpendByTeamMember[] = [...byMember.entries()]
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  return { total, categories, monthly, members, count: rows.length };
}
