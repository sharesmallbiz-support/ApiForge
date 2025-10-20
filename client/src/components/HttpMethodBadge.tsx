import { Badge } from "@/components/ui/badge";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

interface HttpMethodBadgeProps {
  method: HttpMethod;
  className?: string;
}

const methodColors: Record<HttpMethod, string> = {
  GET: "bg-http-get text-white",
  POST: "bg-http-post text-white",
  PUT: "bg-http-put text-white",
  DELETE: "bg-http-delete text-white",
  PATCH: "bg-http-patch text-white",
};

export function HttpMethodBadge({ method, className }: HttpMethodBadgeProps) {
  return (
    <Badge
      className={`font-mono text-xs font-semibold ${methodColors[method]} ${className || ""}`}
      data-testid={`badge-method-${method.toLowerCase()}`}
    >
      {method}
    </Badge>
  );
}
