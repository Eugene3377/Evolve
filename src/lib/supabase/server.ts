import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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
 * Server-side Supabase client for use in Server Components, Server Actions,
 * and Route Handlers. Still uses only the public anon key — RLS decides
 * what the signed-in user can see or change. The service role key is never
 * imported here or anywhere in the Next.js app; it only ever lives inside
 * Supabase Edge Functions, set as a server-side secret.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = getEnv();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component during render — the
          // proxy layer already refreshes the session, so this is safe
          // to ignore.
        }
      },
    },
  });
}
