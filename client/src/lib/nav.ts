import {
  LayoutDashboard,
  Users,
  Receipt,
  FileText,
  AlertTriangle,
  CalendarClock,
  BarChart3,
  ArrowLeftRight,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard },
  { label: "Clients", to: "/clients", icon: Users },
  { label: "Payments", to: "/payments", icon: Receipt },
  { label: "Invoices", to: "/invoices", icon: FileText },
  { label: "Overdue", to: "/overdue", icon: AlertTriangle },
  { label: "Upcoming Dues", to: "/upcoming-dues", icon: CalendarClock },
  { label: "Reports", to: "/reports", icon: BarChart3 },
  { label: "Import / Export", to: "/import-export", icon: ArrowLeftRight },
  { label: "Settings", to: "/settings", icon: Settings },
];
