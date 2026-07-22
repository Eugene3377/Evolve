// supabase/functions/webhook-receipts/index.ts
//
// Example webhook receiver for a card/bank processor (Stripe Issuing,
// Marqeta, Plaid, etc). This is the ONE place in the whole system that
// uses the Supabase service role key — Edge Functions run outside the
// browser, so the key is safe here as a function secret. It is never
// exposed to Next.js or the client.
//
// Deploy:   supabase functions deploy webhook-receipts --no-verify-jwt
// Secrets:  supabase secrets set SUPABASE_SERVICE_ROLE_KEY=... WEBHOOK_SIGNING_SECRET=...
//
// Point your processor's webhook URL at:
//   https://<project-ref>.functions.supabase.co/webhook-receipts

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SIGNING_SECRET = Deno.env.get("WEBHOOK_SIGNING_SECRET");

// Service-role client: bypasses RLS. Only ever instantiated inside an
// Edge Function, and only used to write rows this webhook is explicitly
// trusted to write.
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

function verifySignature(req: Request, rawBody: string): boolean {
  if (!SIGNING_SECRET) return true; // no secret configured yet — dev mode
  const signature = req.headers.get("x-webhook-signature");
  // Swap in your processor's actual HMAC verification scheme here.
  return Boolean(signature);
}

Deno.serve(async (req) => {
  const rawBody = await req.text();

  if (!verifySignature(req, rawBody)) {
    return new Response("Invalid signature", { status: 401 });
  }

  const event = JSON.parse(rawBody);

  // Expected shape — adapt to your processor's actual payload:
  // { org_external_id, merchant, amount, currency, occurred_at, external_ref }
  const { org_external_id, merchant, amount, currency, occurred_at, external_ref } = event;

  const { data: org } = await admin
    .from("organizations")
    .select("id, default_currency")
    .eq("slug", org_external_id)
    .maybeSingle();

  if (!org) {
    return new Response(JSON.stringify({ error: "Unknown organization" }), { status: 404 });
  }

  const { error } = await admin.from("transactions").insert({
    org_id: org.id,
    merchant,
    amount,
    currency: currency ?? org.default_currency,
    occurred_at: occurred_at ?? new Date().toISOString(),
    external_ref,
    status: "pending",
    source: "card_feed",
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
