import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatCurrency } from "@/lib/utils";
import type { StatusBreakdownPoint } from "@shared/types";
import { PieChart as PieChartIcon } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  Paid: "hsl(var(--success))",
  Partial: "hsl(var(--warning))",
  Pending: "hsl(var(--muted-foreground))",
  Overdue: "hsl(var(--destructive))",
};

export function StatusPieChart({ data }: { data: StatusBreakdownPoint[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Status</CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <EmptyState icon={PieChartIcon} title="No invoices yet" description="Status breakdown will appear here." />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={data} dataKey="count" nameKey="status" innerRadius={60} outerRadius={95} paddingAngle={2}>
                {data.map((entry) => (
                  <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, _name, entry) => [
                  `${value} invoice(s) · ${formatCurrency(entry.payload.amount)}`,
                  entry.payload.status,
                ]}
                contentStyle={{ borderRadius: 8, fontSize: 13, border: "1px solid hsl(var(--border))" }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
