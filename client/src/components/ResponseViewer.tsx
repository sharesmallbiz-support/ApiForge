import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusCodeBadge } from "./StatusCodeBadge";
import { Badge } from "@/components/ui/badge";
import { Clock, Database } from "lucide-react";
import { RequestHistory } from "./RequestHistory";
import type { ExecutionResult } from "@shared/schema";

interface ResponseViewerProps {
  statusCode?: number;
  responseTime?: number;
  size?: number;
  body?: string;
  headers?: Record<string, string>;
  requestId?: string;
  onLoadHistory?: (result: ExecutionResult) => void;
}

export function ResponseViewer({
  statusCode = 200,
  responseTime = 245,
  size = 1240,
  body = '{\n  "id": 1,\n  "name": "John Doe",\n  "email": "john@example.com",\n  "role": "admin"\n}',
  headers = {
    "content-type": "application/json",
    "cache-control": "no-cache",
    "date": new Date().toUTCString(),
  },
  requestId,
  onLoadHistory,
}: ResponseViewerProps) {
  const [selectedTab, setSelectedTab] = useState("body");

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 p-4 border-b">
        <StatusCodeBadge code={statusCode} />
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span className="font-mono">{responseTime}ms</span>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Database className="h-3 w-3" />
          <span className="font-mono">{(size / 1024).toFixed(2)}KB</span>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-4 w-fit">
          <TabsTrigger value="body" data-testid="tab-response-body">Body</TabsTrigger>
          <TabsTrigger value="headers" data-testid="tab-response-headers">Headers</TabsTrigger>
          <TabsTrigger value="cookies" data-testid="tab-response-cookies">Cookies</TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-response-history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="body" className="flex-1 p-4 overflow-auto">
          <pre className="text-xs font-mono p-4 rounded-md bg-card border overflow-auto">
            <code>{body}</code>
          </pre>
        </TabsContent>

        <TabsContent value="headers" className="flex-1 p-4 overflow-auto">
          <div className="space-y-2">
            {Object.entries(headers).map(([key, value]) => (
              <div
                key={key}
                className="grid grid-cols-2 gap-4 p-3 rounded-md bg-card text-sm"
              >
                <span className="font-mono font-semibold">{key}</span>
                <span className="font-mono text-muted-foreground">{value}</span>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="cookies" className="flex-1 p-4 overflow-auto">
          <div className="text-sm text-muted-foreground text-center py-8">
            No cookies in this response
          </div>
        </TabsContent>

        <TabsContent value="history" className="flex-1 overflow-hidden">
          <RequestHistory requestId={requestId} onSelectHistory={onLoadHistory} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
