import { createBrowserClient } from "@supabase/ssr";

function getEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Create a .env.local file in the project root (copy .env.example) " +
        "with your Supabase project's URL and anon key, then restart `npm run dev`."
    );
  }

  return { url, anonKey };
}

/**
 * Browser-side Supabase client. Uses the public anon key only — this file
 * is safe to import from client components. The anon key relies entirely
 * on Row Level Security policies in Postgres for data access control.
 */
export function createClient() {
  const { url, anonKey } = getEnv();
  return createBrowserClient(url, anonKey);
}
