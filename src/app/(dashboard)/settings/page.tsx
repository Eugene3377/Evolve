import { redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/data/org-context";
import { listCategories } from "@/lib/data/expenses";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { updateOrganization, addCategory, archiveCategory } from "./actions";

export default async function SettingsPage() {
  const { organization, membership } = await requireOrgContext();
  if (membership.role !== "admin") redirect("/dashboard");

  const categories = await listCategories(organization.id);

  async function archiveAction(formData: FormData) {
    "use server";
    await archiveCategory(String(formData.get("category_id")));
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Organization</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateOrganization} className="grid gap-5 sm:grid-cols-2">
            <Field label="Organization name" htmlFor="org_name">
              <Input id="org_name" name="name" defaultValue={organization.name} required />
            </Field>
            <Field label="Default currency" htmlFor="org_currency" hint="Three-letter ISO code">
              <Input
                id="org_currency"
                name="default_currency"
                defaultValue={organization.default_currency}
                maxLength={3}
                required
              />
            </Field>
            <div className="sm:col-span-2">
              <Button type="submit">Save changes</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Spend categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={addCategory} className="flex gap-2">
            <Input name="name" placeholder="e.g. Software" className="flex-1" required />
            <Button type="submit" variant="secondary">
              Add
            </Button>
          </form>
          <ul className="divide-y divide-line rounded-md border border-line">
            {categories.length === 0 && (
              <li className="px-4 py-3 text-sm text-ink-600">No categories yet.</li>
            )}
            {categories.map((c) => (
              <li key={c.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                {c.name}
                <form action={archiveAction}>
                  <input type="hidden" name="category_id" value={c.id} />
                  <Button size="sm" variant="ghost" type="submit">
                    Archive
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What's next</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-ink-700">
          <p>
            Evolve's schema and storage layout leave room to grow: corporate
            cards, budgets and spend limits, procurement requests, accounting
            sync (QuickBooks, Xero, NetSuite), and deeper analytics can each
            be added as their own modules without reshaping what exists
            today.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
