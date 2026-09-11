export interface DashboardSummary {
  totalClients: number;
  activeClients: number;
  expectedRevenue: number;
  collectedRevenue: number;
  pendingAmount: number;
  overdueAmount: number;
  partialAmount: number;
  outstandingBalance: number;
  collectionRate: number;
  dueSoonCount: number;
}

export interface MonthlyRevenuePoint {
  month: string; // "YYYY-MM"
  label: string; // "Jan 2026"
  expected: number;
  collected: number;
}

export interface StatusBreakdownPoint {
  status: string;
  count: number;
  amount: number;
}

export interface OutstandingClientPoint {
  id: string;
  clientId: string;
  name: string;
  company: string;
  outstanding: number;
}

export interface DashboardResponse {
  summary: DashboardSummary;
  monthlyRevenue: MonthlyRevenuePoint[];
  statusBreakdown: StatusBreakdownPoint[];
  topOutstanding: OutstandingClientPoint[];
}
