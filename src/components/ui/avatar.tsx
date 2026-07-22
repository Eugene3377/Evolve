import { cn } from "@/lib/utils";
import { initials } from "@/lib/utils";

export function Avatar({
  name,
  className,
}: {
  name?: string | null;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink-900 text-xs font-semibold text-paper-50",
        className
      )}
    >
      {initials(name)}
    </div>
  );
}

const ROLE_STYLE: Record<string, string> = {
  admin: "bg-brass-100 text-brass-600",
  manager: "bg-info-100 text-info-600",
  employee: "bg-paper-200 text-ink-700",
};

export function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        ROLE_STYLE[role] ?? "bg-paper-200 text-ink-700"
      )}
    >
      {role}
    </span>
  );
}
