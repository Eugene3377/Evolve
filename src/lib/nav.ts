import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Receipt,
  CheckSquare,
  ArrowLeftRight,
  FileText,
  Users,
  BarChart3,
  ShieldCheck,
  Settings,
} from "lucide-react";
import type { OrgRole } from "@/types/domain";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  minRole: OrgRole;
}

export const NAV: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, minRole: "employee" },
  { href: "/expenses", label: "Expenses", icon: Receipt, minRole: "employee" },
  { href: "/approvals", label: "Approvals", icon: CheckSquare, minRole: "employee" },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight, minRole: "employee" },
  { href: "/bills", label: "Bills", icon: FileText, minRole: "employee" },
  { href: "/reports", label: "Reports", icon: BarChart3, minRole: "manager" },
  { href: "/team", label: "Team", icon: Users, minRole: "manager" },
  { href: "/audit-log", label: "Audit log", icon: ShieldCheck, minRole: "manager" },
  { href: "/settings", label: "Settings", icon: Settings, minRole: "admin" },
];

export function titleForPath(pathname: string) {
  const match = NAV.find(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/")
  );
  return match?.label ?? "Evolve";
}
