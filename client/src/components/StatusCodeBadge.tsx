import { Badge } from "@/components/ui/badge";

interface StatusCodeBadgeProps {
  code: number;
  className?: string;
}

function getStatusColor(code: number): string {
  if (code >= 200 && code < 300) return "bg-chart-2 text-white";
  if (code >= 300 && code < 400) return "bg-chart-5 text-white";
  if (code >= 400 && code < 500) return "bg-chart-3 text-white";
  if (code >= 500) return "bg-chart-4 text-white";
  return "bg-muted text-muted-foreground";
}

export function StatusCodeBadge({ code, className }: StatusCodeBadgeProps) {
  return (
    <Badge
      className={`font-mono text-xs font-semibold ${getStatusColor(code)} ${className || ""}`}
      data-testid={`badge-status-${code}`}
    >
      {code}
    </Badge>
  );
}
