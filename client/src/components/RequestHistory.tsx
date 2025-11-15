import { useQuery } from "@tanstack/react-query";
import { Clock, Database } from "lucide-react";
import { StatusCodeBadge } from "./StatusCodeBadge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ExecutionResult } from "@shared/schema";

interface RequestHistoryProps {
  requestId?: string;
  onSelectHistory?: (result: ExecutionResult) => void;
}

export function RequestHistory({ requestId, onSelectHistory }: RequestHistoryProps) {
  const { data: resultsData } = useQuery<{ results: ExecutionResult[] }>({
    queryKey: [`/api/requests/${requestId}/history`],
    enabled: !!requestId,
  });

  const results = resultsData?.results || [];

  if (!requestId) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        Select a request to view its history
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        No execution history yet. Send a request to see results here.
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-2 p-4">
        {results.map((result) => (
          <div
            key={result.id}
            className="p-3 rounded-md border hover:bg-accent cursor-pointer transition-colors"
            onClick={() => onSelectHistory?.(result)}
          >
            <div className="flex items-center justify-between mb-2">
              <StatusCodeBadge code={result.status} />
              <span className="text-xs text-muted-foreground">
                {new Date(result.timestamp).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span className="font-mono">{result.time}ms</span>
              </div>
              <div className="flex items-center gap-1">
                <Database className="h-3 w-3" />
                <span className="font-mono">{(result.size / 1024).toFixed(2)}KB</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
