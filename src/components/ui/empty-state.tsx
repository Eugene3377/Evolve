import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-paper-100 text-ink-600">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-ink-950">{title}</p>
        <p className="mx-auto max-w-sm text-sm text-ink-600">{description}</p>
      </div>
      {action}
    </div>
  );
}
