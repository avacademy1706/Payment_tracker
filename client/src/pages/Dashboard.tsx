import * as React from "react";
import { Users, IndianRupee, Wallet, AlertCircle, Clock3, Scale } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { StatusPieChart } from "@/components/dashboard/StatusPieChart";
import { TopOutstandingTable } from "@/components/dashboard/TopOutstandingTable";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboard, type DashboardParams } from "@/hooks/useDashboard";
import { formatCurrency } from "@/lib/utils";

const PERIOD_LABELS: Record<DashboardParams["period"], string> = {
  currentMonth: "Current Month",
  previousMonth: "Previous Month",
  currentYear: "Current Year",
  custom: "Custom Range",
};

export default function Dashboard() {
  const [period, setPeriod] = React.useState<DashboardParams["period"]>("currentMonth");
  const { data, isLoading } = useDashboard({ period });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="A snapshot of collections, dues and outstanding balances."
        actions={
          <Select value={period} onValueChange={(v) => setPeriod(v as DashboardParams["period"])}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PERIOD_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {isLoading && !data ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 2xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 2xl:grid-cols-6">
            <StatCard label="Total Clients" value={String(data.summary.totalClients)} icon={Users} hint={`${data.summary.activeClients} active`} />
            <StatCard label="Expected Revenue" value={formatCurrency(data.summary.expectedRevenue)} icon={IndianRupee} />
            <StatCard label="Collected" value={formatCurrency(data.summary.collectedRevenue)} icon={Wallet} tone="success" hint={`${data.summary.collectionRate.toFixed(1)}% collection rate`} />
            <StatCard label="Pending" value={formatCurrency(data.summary.pendingAmount)} icon={Clock3} />
            <StatCard label="Overdue" value={formatCurrency(data.summary.overdueAmount)} icon={AlertCircle} tone="destructive" hint={`${data.summary.dueSoonCount} due within 7 days`} />
            <StatCard label="Outstanding Balance" value={formatCurrency(data.summary.outstandingBalance)} icon={Scale} tone="warning" />
          </div>

          <div className="grid gap-4 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <RevenueChart data={data.monthlyRevenue} />
            </div>
            <div className="lg:col-span-2">
              <StatusPieChart data={data.statusBreakdown} />
            </div>
          </div>

          <TopOutstandingTable data={data.topOutstanding} />
        </>
      ) : null}
    </div>
  );
}
