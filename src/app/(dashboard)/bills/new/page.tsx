import { redirect } from "next/navigation";
import { requireOrgContext, hasRole } from "@/lib/data/org-context";
import { listCategories } from "@/lib/data/expenses";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NewBillForm } from "./bill-form";

export default async function NewBillPage() {
  const { organization, membership } = await requireOrgContext();
  if (!hasRole(membership.role, "manager")) redirect("/bills");
  const categories = await listCategories(organization.id);

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>New bill</CardTitle>
        </CardHeader>
        <CardContent>
          <NewBillForm categories={categories} />
        </CardContent>
      </Card>
    </div>
  );
}
