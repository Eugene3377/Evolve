import { cn } from "@/lib/utils";

const STYLES: Record<string, string> = {
  draft: "bg-paper-200 text-ink-700",
  submitted: "bg-info-100 text-info-600",
  awaiting_approval: "bg-info-100 text-info-600",
  pending: "bg-warning-100 text-warning-600",
  approved: "bg-positive-100 text-positive-600",
  scheduled: "bg-info-100 text-info-600",
  paid: "bg-positive-100 text-positive-600",
  reimbursed: "bg-positive-100 text-positive-600",
  matched: "bg-positive-100 text-positive-600",
  posted: "bg-paper-200 text-ink-700",
  flagged: "bg-warning-100 text-warning-600",
  rejected: "bg-danger-100 text-danger-600",
  void: "bg-danger-100 text-danger-600",
  revoked: "bg-danger-100 text-danger-600",
  expired: "bg-paper-200 text-ink-700",
  accepted: "bg-positive-100 text-positive-600",
};

const LABELS: Record<string, string> = {
  awaiting_approval: "Awaiting approval",
};

export function StatusPill({ status }: { status: string }) {
  const label = LABELS[status] ?? status.replace(/_/g, " ");
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        STYLES[status] ?? "bg-paper-200 text-ink-700"
      )}
    >
      {label}
    </span>
  );
}
