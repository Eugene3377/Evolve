"use client";

import { useRouter } from "next/navigation";
import { LogOut, Menu } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/avatar";
import { RoleBadge } from "@/components/ui/avatar";
import type { OrgRole } from "@/types/domain";

export function Topbar({
  fullName,
  role,
  title,
  onMenuClick,
}: {
  fullName: string | null;
  role: OrgRole;
  title: string;
  onMenuClick?: () => void;
}) {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-line bg-white px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-md p-1.5 text-ink-700 hover:bg-paper-100 md:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-base font-semibold text-ink-950">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <RoleBadge role={role} />
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium leading-tight text-ink-950">
            {fullName ?? "You"}
          </p>
        </div>
        <Avatar name={fullName} />
        <button
          onClick={signOut}
          className="rounded-md p-2 text-ink-600 hover:bg-paper-100 hover:text-ink-950"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
