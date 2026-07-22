export type OrgRole = "admin" | "manager" | "employee";

export type ExpenseStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "rejected"
  | "reimbursed";

export type BillStatus =
  | "draft"
  | "awaiting_approval"
  | "approved"
  | "scheduled"
  | "paid"
  | "void";

export type ApprovalStatus = "pending" | "approved" | "rejected";
export type TxnStatus = "pending" | "posted" | "flagged" | "matched";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  default_currency: string;
  created_at: string;
  created_by: string | null;
}

export interface OrgMember {
  id: string;
  org_id: string;
  user_id: string;
  role: OrgRole;
  full_name: string | null;
  title: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  org_id: string;
  name: string;
  icon: string | null;
  is_archived: boolean;
}

export interface Team {
  id: string;
  org_id: string;
  name: string;
  lead_member_id: string | null;
}

export interface Expense {
  id: string;
  org_id: string;
  submitted_by: string;
  team_id: string | null;
  category_id: string | null;
  merchant: string;
  description: string | null;
  amount: number;
  currency: string;
  spent_at: string;
  status: ExpenseStatus;
  receipt_path: string | null;
  matched_transaction_id: string | null;
  submitted_at: string | null;
  decided_at: string | null;
  decided_by: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  // joined
  category?: Pick<Category, "id" | "name" | "icon"> | null;
  submitter?: Pick<OrgMember, "id" | "full_name"> | null;
}

export interface Bill {
  id: string;
  org_id: string;
  created_by: string;
  vendor_name: string;
  invoice_number: string | null;
  category_id: string | null;
  amount: number;
  currency: string;
  issue_date: string;
  due_date: string | null;
  status: BillStatus;
  file_path: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  category?: Pick<Category, "id" | "name" | "icon"> | null;
}

export interface Transaction {
  id: string;
  org_id: string;
  member_id: string | null;
  merchant: string;
  category_id: string | null;
  amount: number;
  currency: string;
  status: TxnStatus;
  occurred_at: string;
  external_ref: string | null;
  source: string;
  category?: Pick<Category, "id" | "name" | "icon"> | null;
  member?: Pick<OrgMember, "id" | "full_name"> | null;
}

export interface Approval {
  id: string;
  org_id: string;
  subject_type: "expense" | "bill";
  subject_id: string;
  step_order: number;
  approver_id: string | null;
  status: ApprovalStatus;
  comment: string | null;
  decided_at: string | null;
  created_at: string;
  approver?: Pick<OrgMember, "id" | "full_name"> | null;
}

export interface AuditLog {
  id: string;
  org_id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  actor?: Pick<OrgMember, "id" | "full_name"> | null;
}

export interface OrgContext {
  organization: Organization;
  membership: OrgMember;
}
