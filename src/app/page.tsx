import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LandingScene } from "@/components/landing/landing-scene";

const FEATURES = [
  {
    title: "One inbox for spend",
    body: "Expenses, bills, and card transactions land in a single feed instead of three disconnected tools.",
  },
  {
    title: "Approvals that don't stall",
    body: "Role-based routing means the right manager sees a request the moment it's submitted.",
  },
  {
    title: "Receipts that match themselves",
    body: "Upload a receipt and Evolve reconciles it against your transaction feed automatically.",
  },
  {
    title: "Reporting without spreadsheets",
    body: "Spend by team, category, or time range — ready the moment finance needs an answer.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex-1 bg-ink-950 text-paper-50">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brass-500 text-ink-950">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="font-display text-xl">Evolve</span>
        </div>
        <nav className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-paper-100/80 hover:text-white">
            Sign in
          </Link>
          <Link href="/signup">
            <Button size="sm">Get started</Button>
          </Link>
        </nav>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-6 pb-20 pt-8 lg:grid-cols-2 lg:pt-16">
        <div>
          <p className="mb-4 inline-flex items-center rounded-full border border-white/15 px-3 py-1 text-xs uppercase tracking-wider text-brass-500">
            Finance operations, unified
          </p>
          <h1 className="font-display text-4xl leading-tight sm:text-5xl">
            Company spend, kept in one honest ledger.
          </h1>
          <p className="mt-5 max-w-md text-lg text-paper-100/70">
            Evolve brings expenses, bills, approvals, and reporting into a
            single workspace built for how growing teams actually spend
            money.
          </p>
          <div className="mt-8 flex items-center gap-3">
            <Link href="/signup">
              <Button size="md">
                Start free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="md" variant="secondary" className="bg-transparent text-paper-50 border-white/20 hover:bg-white/10">
                Sign in
              </Button>
            </Link>
          </div>
        </div>

        <div className="h-80 rounded-xl border border-white/10 bg-ink-900 sm:h-96">
          <LandingScene />
        </div>
      </section>

      <section className="border-t border-white/10 bg-ink-900">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-16 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title}>
              <h3 className="font-medium text-paper-50">{f.title}</h3>
              <p className="mt-2 text-sm text-paper-100/60">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 py-8 text-xs text-paper-100/40">
        © {new Date().getFullYear()} Evolve. Built for finance teams that
        want a straight answer about where the money went.
      </footer>
    </div>
  );
}
