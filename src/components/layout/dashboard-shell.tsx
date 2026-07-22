"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { titleForPath } from "@/lib/nav";
import type { OrgRole } from "@/types/domain";

export function DashboardShell({
  role,
  orgName,
  fullName,
  children,
}: {
  role: OrgRole;
  orgName: string;
  fullName: string | null;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      <Sidebar role={role} orgName={orgName} />

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="absolute inset-0 bg-ink-950/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative flex w-64 flex-col bg-ink-950">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 rounded-md p-1.5 text-paper-100/70 hover:bg-white/10"
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </button>
            <Sidebar role={role} orgName={orgName} forceVisible />
          </div>
        </div>
      )}

      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar
          fullName={fullName}
          role={role}
          title={titleForPath(pathname)}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main className="flex-1 bg-paper-50 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
