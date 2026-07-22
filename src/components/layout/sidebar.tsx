"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV } from "@/lib/nav";
import type { OrgRole } from "@/types/domain";

const RANK: Record<OrgRole, number> = { employee: 0, manager: 1, admin: 2 };

export function Sidebar({
  role,
  orgName,
  forceVisible = false,
}: {
  role: OrgRole;
  orgName: string;
  forceVisible?: boolean;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "w-60 shrink-0 flex-col border-r border-line bg-ink-950 text-paper-100",
        forceVisible ? "flex" : "hidden md:flex"
      )}
    >
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brass-500 text-ink-950">
          <Sparkles className="h-4 w-4" strokeWidth={2} />
        </div>
        <div className="leading-tight">
          <p className="font-display text-base tracking-wide">Evolve</p>
        </div>
      </div>

      <p className="truncate px-5 pb-3 text-xs uppercase tracking-wider text-paper-100/40">
        {orgName}
      </p>

      <nav className="flex-1 space-y-0.5 px-3">
        {NAV.filter((item) => RANK[role] >= RANK[item.minRole]).map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-white/10 text-white font-medium"
                  : "text-paper-100/70 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={1.75} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-5 py-4 text-xs text-paper-100/40">
        Multi-tenant finance ops
      </div>
    </aside>
  );
}
