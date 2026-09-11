import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  Paid: "bg-success/15 text-success border-success/30",
  Partial: "bg-warning/15 text-warning border-warning/30",
  Pending: "bg-muted text-muted-foreground border-border",
  Overdue: "bg-destructive/15 text-destructive border-destructive/30",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge variant="outline" className={cn("font-medium", STATUS_STYLES[status] ?? "", className)}>
      {status}
    </Badge>
  );
}
