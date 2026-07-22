# Evolve

A multi-tenant finance operations workspace..expenses, bills, approvals, a
transaction feed, and reporting, all in one place. Built with Next.js (App
Router), TypeScript, Tailwind CSS, and Supabase (Postgres, Auth, Storage,
Edge Functions).

## Stack

- **Next.js 15 / React 19 / TypeScript** — App Router, Server Actions
- **Tailwind CSS v4** — design tokens in `src/app/globals.css`
- **Supabase Postgres** — schema + Row Level Security in `supabase/migrations`
- **Supabase Auth** — email/password, session refresh via middleware
- **Supabase Storage** — private `receipts` and `invoices` buckets
- **Supabase Edge Functions** — invite email delivery, card-feed webhook intake
- **Three.js** — ambient hero scene on the marketing page only

## Getting started

1. **Create a Supabase project** at supabase.com.
2. **Run the migration**:
   ```bash
   supabase link --project-ref your-project-ref
   supabase db push
   ```
   This creates every table, enum, RLS policy, and the two private storage
   buckets (`receipts`, `invoices`).
3. **Copy env vars**:
   ```bash
   cp .env.example .env.local
   ```
   Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   from Project Settings → API. Never put the service role key here.
4. **Install and run**:
   ```bash
   npm install
   npm run dev
   ```
5. **Deploy the Edge Functions** (optional, for invites + a card-feed webhook):
   ```bash
   supabase functions deploy invite-member
   supabase functions deploy webhook-receipts --no-verify-jwt
   supabase secrets set RESEND_API_KEY=... SITE_URL=https://your-app.com
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=... WEBHOOK_SIGNING_SECRET=...
   ```

## How access control works

Every tenant-scoped table has `org_id` and Row Level Security is **on** for
all of them (`supabase/migrations/0001_init.sql`). Three `security definer`
SQL helpers (`is_org_member`, `is_org_manager_or_admin`, `org_role_of`)
back every policy, so authorization logic lives in one place instead of
being re-implemented per table. Roles are `admin`, `manager`, `employee`;
`src/lib/data/org-context.ts` has the same rank check on the app side for
UI gating, but the database is the real enforcement boundary — the browser
only ever holds the public anon key.

The **service role key never appears in this repo's app code.** It's only
referenced inside `supabase/functions/webhook-receipts`, as a secret set
on that one Edge Function, for the one case (an inbound card-processor
webhook) that legitimately needs to bypass RLS.

## Project structure

```
src/
  app/
    (auth)/            login, signup, onboarding
    (dashboard)/        the product — expenses, approvals, transactions,
                         bills, team, reports, audit-log, settings
    auth/callback/       Supabase auth code exchange
    page.tsx             marketing landing page
  components/
    ui/                  Button, Card, Field, StatusPill, Avatar…
    layout/              Sidebar, Topbar, DashboardShell
    reports/              recharts wrappers
    landing/               Three.js hero scene
  lib/
    supabase/            browser / server / middleware clients
    data/                 server-only queries + the org-context guard
  types/domain.ts         shared TypeScript types matching the schema
supabase/
  migrations/0001_init.sql   full schema + RLS + storage policies
  functions/                  invite-member, webhook-receipts
```

## What's next

The schema and module boundaries are deliberately left room to grow:

- **Cards** — a `cards` table + issuer webhook feeding `transactions`
- **Budgets** — per-team/category limits checked at submission time
- **Procurement** — purchase requests upstream of the bill workflow
- **Accounting sync** — an Edge Function pushing approved bills to
  QuickBooks/Xero/NetSuite
- **Deeper analytics** — a materialized view once `getSpendSummary`
  (currently reducing rows in the reports server component) needs to scale
