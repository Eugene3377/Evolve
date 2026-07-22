"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }

    router.replace(searchParams.get("next") ?? "/dashboard");
    router.refresh();
  }

  return (
    <div>
      <h1 className="text-lg font-semibold text-ink-950">Welcome back</h1>
      <p className="mt-1 text-sm text-ink-600">Sign in to your workspace.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Field label="Work email" htmlFor="email">
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </Field>
        <Field label="Password" htmlFor="password">
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </Field>

        {error && (
          <p className="rounded-md bg-danger-100 px-3 py-2 text-sm text-danger-600">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-600">
        New to Evolve?{" "}
        <Link href="/signup" className="font-medium text-brass-600 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
