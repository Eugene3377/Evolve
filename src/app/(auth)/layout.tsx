import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper-100 px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-ink-950 text-brass-500">
          <Sparkles className="h-4 w-4" />
        </div>
        <span className="font-display text-xl text-ink-950">Evolve</span>
      </Link>
      <div className="w-full max-w-sm rounded-lg border border-line bg-white p-8 shadow-sm">
        {children}
      </div>
    </div>
  );
}
