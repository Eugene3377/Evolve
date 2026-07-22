// supabase/functions/invite-member/index.ts
//
// Sends a team-invite email. Deployed as a Supabase Edge Function so the
// Resend (or any provider) API key never touches the browser or the
// Next.js server — it's a secret set only on this function.
//
// Deploy:   supabase functions deploy invite-member
// Secret:   supabase secrets set RESEND_API_KEY=...
//
// Invoked from the Next.js app via supabase.functions.invoke("invite-member", ...)
// using the user's own session — this function re-checks that the caller
// is actually a manager/admin of the org before sending anything.

import { createClient } from "jsr:@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SITE_URL = Deno.env.get("SITE_URL") ?? "http://localhost:3000";

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get("Authorization") ?? "";

    // Client scoped to the calling user — RLS still applies, so this can
    // only read invites/orgs the caller is actually allowed to see.
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { invite_id, email, org_name, token } = await req.json();

    // Re-verify the invite exists and belongs to an org the caller can
    // see (RLS enforces "managers/admins only" on org_invites reads).
    const { data: invite, error } = await supabase
      .from("org_invites")
      .select("id, email, org_id")
      .eq("id", invite_id)
      .single();

    if (error || !invite) {
      return new Response(JSON.stringify({ error: "Invite not found or not permitted" }), {
        status: 403,
      });
    }

    const acceptUrl = `${SITE_URL}/signup?invite=${token}`;

    if (!RESEND_API_KEY) {
      // No email provider configured yet — don't fail the invite flow,
      // just skip delivery. The invite row still exists and can be
      // resent once a provider key is set.
      console.warn("RESEND_API_KEY not set — skipping email delivery");
      return new Response(JSON.stringify({ skipped: true }), { status: 200 });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Evolve <notifications@yourdomain.com>",
        to: email,
        subject: `You've been invited to ${org_name} on Evolve`,
        html: `
          <p>You've been invited to join <strong>${org_name}</strong> on Evolve.</p>
          <p><a href="${acceptUrl}">Accept your invite</a></p>
          <p>This link expires in 14 days.</p>
        `,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return new Response(JSON.stringify({ error: text }), { status: 502 });
    }

    return new Response(JSON.stringify({ sent: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
