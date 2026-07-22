-- Evolve: multi-tenant finance operations schema
-- All tenant-scoped tables carry org_id and are protected by Row Level Security.

create extension if not exists "pgcrypto";

-- ============================================================================
-- ENUMS
-- ============================================================================
create type org_role as enum ('admin', 'manager', 'employee');
create type expense_status as enum ('draft', 'submitted', 'approved', 'rejected', 'reimbursed');
create type bill_status as enum ('draft', 'awaiting_approval', 'approved', 'scheduled', 'paid', 'void');
create type approval_status as enum ('pending', 'approved', 'rejected');
create type approval_subject as enum ('expense', 'bill');
create type invite_status as enum ('pending', 'accepted', 'revoked', 'expired');
create type txn_status as enum ('pending', 'posted', 'flagged', 'matched');

-- ============================================================================
-- CORE TENANCY
-- ============================================================================
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  default_currency text not null default 'USD',
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id)
);

create table org_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role org_role not null default 'employee',
  full_name text,
  title text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (org_id, user_id)
);

create table org_invites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  email text not null,
  role org_role not null default 'employee',
  status invite_status not null default 'pending',
  invited_by uuid references auth.users (id),
  token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '14 days'),
  unique (org_id, email, status)
);

-- ============================================================================
-- TAXONOMY
-- ============================================================================
create table categories (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  name text not null,
  icon text,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  unique (org_id, name)
);

create table teams (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  name text not null,
  lead_member_id uuid references org_members (id),
  created_at timestamptz not null default now(),
  unique (org_id, name)
);

create table team_members (
  team_id uuid not null references teams (id) on delete cascade,
  member_id uuid not null references org_members (id) on delete cascade,
  primary key (team_id, member_id)
);

-- ============================================================================
-- EXPENSES
-- ============================================================================
create table expenses (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  submitted_by uuid not null references org_members (id),
  team_id uuid references teams (id),
  category_id uuid references categories (id),
  merchant text not null,
  description text,
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'USD',
  spent_at date not null default current_date,
  status expense_status not null default 'draft',
  receipt_path text,
  matched_transaction_id uuid,
  submitted_at timestamptz,
  decided_at timestamptz,
  decided_by uuid references org_members (id),
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- BILLS / INVOICES (payable)
-- ============================================================================
create table bills (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  created_by uuid not null references org_members (id),
  vendor_name text not null,
  invoice_number text,
  category_id uuid references categories (id),
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'USD',
  issue_date date not null default current_date,
  due_date date,
  status bill_status not null default 'draft',
  file_path text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- TRANSACTIONS (the ledger feed - card/bank activity, real or simulated)
-- ============================================================================
create table transactions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  member_id uuid references org_members (id),
  merchant text not null,
  category_id uuid references categories (id),
  amount numeric(12, 2) not null,
  currency text not null default 'USD',
  status txn_status not null default 'pending',
  occurred_at timestamptz not null default now(),
  external_ref text,
  source text not null default 'manual',
  created_at timestamptz not null default now()
);

-- ============================================================================
-- APPROVALS (generic workflow over expenses & bills)
-- ============================================================================
create table approvals (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  subject_type approval_subject not null,
  subject_id uuid not null,
  step_order int not null default 1,
  approver_id uuid references org_members (id),
  status approval_status not null default 'pending',
  comment text,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- AUDIT LOG (append-only)
-- ============================================================================
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  actor_id uuid references org_members (id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
create index idx_org_members_org on org_members (org_id);
create index idx_org_members_user on org_members (user_id);
create index idx_expenses_org on expenses (org_id, status);
create index idx_expenses_submitted_by on expenses (submitted_by);
create index idx_bills_org on bills (org_id, status);
create index idx_transactions_org on transactions (org_id, occurred_at desc);
create index idx_approvals_subject on approvals (subject_type, subject_id);
create index idx_audit_org on audit_logs (org_id, created_at desc);

-- ============================================================================
-- HELPER FUNCTIONS (security definer, used inside RLS policies)
-- ============================================================================

-- Is the current user an active member of this org?
create or replace function is_org_member(target_org uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from org_members
    where org_id = target_org
      and user_id = auth.uid()
      and is_active = true
  );
$$;

-- Current user's role in this org (null if not a member)
create or replace function org_role_of(target_org uuid)
returns org_role
language sql
security definer
set search_path = public
stable
as $$
  select role from org_members
  where org_id = target_org
    and user_id = auth.uid()
    and is_active = true
  limit 1;
$$;

-- Is the current user admin or manager in this org?
create or replace function is_org_manager_or_admin(target_org uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from org_members
    where org_id = target_org
      and user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'manager')
  );
$$;

-- Convenience: the org_members.id row for the current user in this org
create or replace function my_member_id(target_org uuid)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select id from org_members
  where org_id = target_org
    and user_id = auth.uid()
    and is_active = true
  limit 1;
$$;

-- ============================================================================
-- updated_at triggers
-- ============================================================================
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_expenses_updated_at before update on expenses
  for each row execute function set_updated_at();
create trigger trg_bills_updated_at before update on bills
  for each row execute function set_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table organizations enable row level security;
alter table org_members enable row level security;
alter table org_invites enable row level security;
alter table categories enable row level security;
alter table teams enable row level security;
alter table team_members enable row level security;
alter table expenses enable row level security;
alter table bills enable row level security;
alter table transactions enable row level security;
alter table approvals enable row level security;
alter table audit_logs enable row level security;

-- organizations: visible to members; insert allowed to any authenticated
-- user (they become the creator + first admin via the onboarding flow);
-- update restricted to admins.
create policy "org members can read their org"
  on organizations for select
  using (is_org_member(id));

create policy "authenticated users can create an org"
  on organizations for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "admins can update their org"
  on organizations for update
  using (is_org_member(id) and org_role_of(id) = 'admin');

-- org_members: visible to fellow members; only admins manage membership.
-- Exception: a user may insert themselves as the first admin of an org
-- they just created (handled by the onboarding server action + a check
-- that no members exist yet for that org).
create policy "members can view org roster"
  on org_members for select
  using (is_org_member(org_id));

create policy "admins can add members"
  on org_members for insert
  with check (
    is_org_member(org_id) and org_role_of(org_id) = 'admin'
  );

create policy "first admin can bootstrap membership"
  on org_members for insert
  with check (
    user_id = auth.uid()
    and role = 'admin'
    and not exists (select 1 from org_members m where m.org_id = org_members.org_id)
  );

create policy "admins can update members"
  on org_members for update
  using (is_org_member(org_id) and org_role_of(org_id) = 'admin');

create policy "admins can remove members"
  on org_members for delete
  using (is_org_member(org_id) and org_role_of(org_id) = 'admin');

-- org_invites: admins/managers only
create policy "admins and managers view invites"
  on org_invites for select
  using (is_org_manager_or_admin(org_id));

create policy "admins and managers create invites"
  on org_invites for insert
  with check (is_org_manager_or_admin(org_id));

create policy "admins and managers update invites"
  on org_invites for update
  using (is_org_manager_or_admin(org_id));

-- categories & teams: readable by all members, writable by admin/manager
create policy "members read categories" on categories for select
  using (is_org_member(org_id));
create policy "managers write categories" on categories for insert
  with check (is_org_manager_or_admin(org_id));
create policy "managers update categories" on categories for update
  using (is_org_manager_or_admin(org_id));

create policy "members read teams" on teams for select
  using (is_org_member(org_id));
create policy "managers write teams" on teams for insert
  with check (is_org_manager_or_admin(org_id));
create policy "managers update teams" on teams for update
  using (is_org_manager_or_admin(org_id));

create policy "members read team_members" on team_members for select
  using (exists (select 1 from teams t where t.id = team_members.team_id and is_org_member(t.org_id)));
create policy "managers write team_members" on team_members for insert
  with check (exists (select 1 from teams t where t.id = team_members.team_id and is_org_manager_or_admin(t.org_id)));

-- expenses: employees see + create their own; managers/admins see all in org.
create policy "read own or manage org expenses"
  on expenses for select
  using (
    is_org_member(org_id)
    and (submitted_by = my_member_id(org_id) or is_org_manager_or_admin(org_id))
  );

create policy "members create own expenses"
  on expenses for insert
  with check (
    is_org_member(org_id) and submitted_by = my_member_id(org_id)
  );

create policy "owner edits draft, managers edit any"
  on expenses for update
  using (
    is_org_member(org_id)
    and (
      (submitted_by = my_member_id(org_id) and status in ('draft', 'submitted'))
      or is_org_manager_or_admin(org_id)
    )
  );

create policy "owner deletes own draft"
  on expenses for delete
  using (
    is_org_member(org_id)
    and submitted_by = my_member_id(org_id)
    and status = 'draft'
  );

-- bills: managers/admins manage; employees can view read-only
create policy "members read bills"
  on bills for select
  using (is_org_member(org_id));

create policy "managers create bills"
  on bills for insert
  with check (is_org_manager_or_admin(org_id));

create policy "managers update bills"
  on bills for update
  using (is_org_manager_or_admin(org_id));

create policy "admins delete bills"
  on bills for delete
  using (is_org_member(org_id) and org_role_of(org_id) = 'admin');

-- transactions: members read org feed; only managers/admins (or the
-- service role, via edge functions) write.
create policy "members read transactions"
  on transactions for select
  using (is_org_member(org_id));

create policy "managers write transactions"
  on transactions for insert
  with check (is_org_manager_or_admin(org_id));

create policy "managers update transactions"
  on transactions for update
  using (is_org_manager_or_admin(org_id));

-- approvals: approver + admins/managers can see; only the assigned
-- approver (or an admin) can decide.
create policy "relevant members read approvals"
  on approvals for select
  using (
    is_org_member(org_id)
    and (approver_id = my_member_id(org_id) or is_org_manager_or_admin(org_id))
  );

create policy "managers create approval steps"
  on approvals for insert
  with check (is_org_manager_or_admin(org_id));

create policy "approver or admin decides"
  on approvals for update
  using (
    is_org_member(org_id)
    and (approver_id = my_member_id(org_id) or org_role_of(org_id) = 'admin')
  );

-- audit_logs: append-only, readable by admins/managers only
create policy "managers read audit log"
  on audit_logs for select
  using (is_org_manager_or_admin(org_id));

create policy "members write audit entries"
  on audit_logs for insert
  with check (is_org_member(org_id));

-- ============================================================================
-- STORAGE BUCKETS (receipts, invoices) — private, path-scoped by org
-- Path convention: {org_id}/{entity}/{filename}
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('invoices', 'invoices', false)
on conflict (id) do nothing;

create policy "org members read their receipts"
  on storage.objects for select
  using (
    bucket_id = 'receipts'
    and is_org_member((storage.foldername(name))[1]::uuid)
  );

create policy "org members upload their receipts"
  on storage.objects for insert
  with check (
    bucket_id = 'receipts'
    and is_org_member((storage.foldername(name))[1]::uuid)
  );

create policy "org members read their invoices"
  on storage.objects for select
  using (
    bucket_id = 'invoices'
    and is_org_member((storage.foldername(name))[1]::uuid)
  );

create policy "managers upload invoices"
  on storage.objects for insert
  with check (
    bucket_id = 'invoices'
    and is_org_manager_or_admin((storage.foldername(name))[1]::uuid)
  );
