import { requireOrgContext } from "@/lib/data/org-context";
import { listCategories } from "@/lib/data/expenses";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NewExpenseForm } from "./expense-form";

export default async function NewExpensePage() {
  const { organization } = await requireOrgContext();
  const categories = await listCategories(organization.id);

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>New expense</CardTitle>
        </CardHeader>
        <CardContent>
          <NewExpenseForm categories={categories} />
        </CardContent>
      </Card>
    </div>
  );
}
