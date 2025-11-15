import { useState } from "react";
import { useDebug } from "@/contexts/DebugContext";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Trash2,
  Copy,
  Download,
  AlertCircle,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function DebugPanel() {
  const { requests, responses, errors, clearAll, isEnabled } = useDebug();
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  // Calculate statistics
  const totalRequests = requests.length;
  const totalResponses = responses.length;
  const totalErrors = errors.length;
  const avgResponseTime =
    responses.length > 0
      ? (responses.reduce((sum, r) => sum + r.duration, 0) / responses.length).toFixed(2)
      : "0";
  const successRate =
    responses.length > 0
      ? ((responses.filter(r => r.status >= 200 && r.status < 300).length / responses.length) * 100).toFixed(1)
      : "0";

  // Match requests with their responses
  const requestsWithResponses = requests.map(req => {
    const response = responses.find(res => res.requestId === req.id);
    const error = errors.find(err => err.requestId === req.id);
    return { request: req, response, error };
  }).reverse(); // Show newest first

  const generateCurl = (req: typeof requests[0], res?: typeof responses[0]) => {
    const { method, url, headers, body } = req;

    let curl = `curl -X ${method} "${url}"`;

    // Add headers (redact sensitive ones)
    Object.entries(headers).forEach(([key, value]) => {
      const redactedValue = key.toLowerCase().includes('authorization') ||
                           key.toLowerCase().includes('api-key') ||
                           key.toLowerCase().includes('token')
        ? '***REDACTED***'
        : value;
      curl += ` \\\n  -H "${key}: ${redactedValue}"`;
    });

    // Add body if present
    if (body) {
      const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
      curl += ` \\\n  -d '${bodyStr}'`;
    }

    return curl;
  };

  const copyCurl = (req: typeof requests[0], res?: typeof responses[0]) => {
    const curl = generateCurl(req, res);
    navigator.clipboard.writeText(curl);
    toast({
      title: "CURL copied",
      description: "Command copied to clipboard",
    });
  };

  const exportAll = () => {
    const data = {
      timestamp: new Date().toISOString(),
      requests: requests.map(req => {
        const response = responses.find(res => res.requestId === req.id);
        const error = errors.find(err => err.requestId === req.id);
        return {
          request: req,
          response,
          error,
          curl: generateCurl(req, response),
        };
      }),
      statistics: {
        totalRequests,
        totalResponses,
        totalErrors,
        avgResponseTime: parseFloat(avgResponseTime),
        successRate: parseFloat(successRate),
      },
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `apiforge-debug-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export complete",
      description: "Debug data downloaded successfully",
    });
  };

  const handleClearAll = () => {
    clearAll();
    toast({
      title: "Debug data cleared",
      description: "All requests and responses have been cleared",
    });
  };

  if (!isEnabled) {
    return null;
  }

  if (!isExpanded) {
    return (
      <div className="fixed right-0 top-0 h-full z-50">
        <button
          onClick={() => setIsExpanded(true)}
          className="h-full w-12 bg-gray-800 hover:bg-gray-700 text-white flex items-center justify-center transition-colors"
          title="Open Debug Panel"
        >
          <div className="transform -rotate-90 whitespace-nowrap text-sm font-medium">
            Debug {totalRequests > 0 && `(${totalRequests})`}
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed right-0 top-0 h-full w-[600px] bg-background border-l shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 text-white p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
            className="text-white hover:bg-gray-700"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold">Debug Panel</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={exportAll}
            disabled={requests.length === 0}
            className="text-white hover:bg-gray-700"
            title="Export all debug data"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            disabled={requests.length === 0}
            className="text-white hover:bg-gray-700"
            title="Clear all debug data"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-2 p-3 border-b bg-muted/50">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{avgResponseTime}ms</div>
          <div className="text-xs text-muted-foreground">Avg Response</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{successRate}%</div>
          <div className="text-xs text-muted-foreground">Success Rate</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{totalRequests}</div>
          <div className="text-xs text-muted-foreground">Requests</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{totalErrors}</div>
          <div className="text-xs text-muted-foreground">Errors</div>
        </div>
      </div>

      {/* Content */}
      <Tabs defaultValue="requests" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="requests">
            Requests {totalErrors > 0 && <Badge variant="destructive" className="ml-2">{totalErrors}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-3">
              {requestsWithResponses.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <p>No requests captured yet</p>
                  <p className="text-sm mt-2">Send a request to see debug information</p>
                </div>
              ) : (
                requestsWithResponses.map(({ request, response, error }, index) => (
                  <div
                    key={request.id}
                    className={`border rounded-lg p-3 space-y-2 ${
                      error ? 'border-red-500 bg-red-50 dark:bg-red-950' : 'border-blue-500'
                    }`}
                  >
                    {/* Request Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="font-mono text-xs font-bold">
                          {request.method}
                        </Badge>
                        {response && (
                          <Badge
                            variant={
                              response.status >= 200 && response.status < 300
                                ? "default"
                                : "destructive"
                            }
                          >
                            {response.status}
                          </Badge>
                        )}
                        {response && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {response.duration}ms
                          </span>
                        )}
                        {error && (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Error
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyCurl(request, response)}
                        title="Copy as CURL"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* URL */}
                    <div className="font-mono text-xs break-all bg-muted p-2 rounded">
                      {request.url}
                    </div>

                    {/* Timestamp */}
                    <div className="text-xs text-muted-foreground">
                      {new Date(request.timestamp).toLocaleTimeString()}
                    </div>

                    {/* Error Message */}
                    {error && (
                      <div className="bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded p-2">
                        <div className="text-sm font-semibold text-red-800 dark:text-red-200">
                          {error.message}
                        </div>
                        {error.stack && (
                          <details className="mt-2">
                            <summary className="text-xs cursor-pointer text-red-700 dark:text-red-300">
                              Stack Trace
                            </summary>
                            <pre className="text-xs mt-1 overflow-auto max-h-32 text-red-800 dark:text-red-200">
                              {error.stack}
                            </pre>
                          </details>
                        )}
                      </div>
                    )}

                    {/* Request Details */}
                    <details className={index === 0 ? 'open' : ''}>
                      <summary className="cursor-pointer text-sm font-semibold">
                        Request Details
                      </summary>
                      <div className="mt-2 space-y-2">
                        {/* Headers */}
                        <details>
                          <summary className="cursor-pointer text-xs font-semibold">
                            Headers ({Object.keys(request.headers).length})
                          </summary>
                          <pre className="text-xs mt-1 bg-muted p-2 rounded overflow-auto max-h-32">
                            {JSON.stringify(request.headers, null, 2)}
                          </pre>
                        </details>

                        {/* Body */}
                        {request.body && (
                          <details>
                            <summary className="cursor-pointer text-xs font-semibold">
                              Request Body
                            </summary>
                            <pre className="text-xs mt-1 bg-muted p-2 rounded overflow-auto max-h-32">
                              {typeof request.body === 'string'
                                ? request.body
                                : JSON.stringify(request.body, null, 2)}
                            </pre>
                          </details>
                        )}

                        {/* CURL Command */}
                        <details>
                          <summary className="cursor-pointer text-xs font-semibold">
                            CURL Command
                          </summary>
                          <pre className="text-xs mt-1 bg-muted p-2 rounded overflow-auto max-h-32 font-mono">
                            {generateCurl(request, response)}
                          </pre>
                        </details>
                      </div>
                    </details>

                    {/* Response Details */}
                    {response && (
                      <details className={index === 0 ? 'open' : ''}>
                        <summary className="cursor-pointer text-sm font-semibold">
                          Response - {response.status} {response.statusText} ({response.duration}ms)
                        </summary>
                        <div className="mt-2 space-y-2">
                          {/* Response Headers */}
                          <details>
                            <summary className="cursor-pointer text-xs font-semibold">
                              Response Headers ({Object.keys(response.headers).length})
                            </summary>
                            <pre className="text-xs mt-1 bg-muted p-2 rounded overflow-auto max-h-32">
                              {JSON.stringify(response.headers, null, 2)}
                            </pre>
                          </details>

                          {/* Response Body */}
                          <div>
                            <div className="text-xs font-semibold mb-1">Response Body</div>
                            <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-64">
                              {typeof response.body === 'string'
                                ? response.body
                                : JSON.stringify(response.body, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </details>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="summary" className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Performance Metrics</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Requests:</span>
                    <span className="font-semibold">{totalRequests}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Responses:</span>
                    <span className="font-semibold">{totalResponses}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Errors:</span>
                    <span className="font-semibold text-red-600">{totalErrors}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Success Rate:</span>
                    <span className="font-semibold text-green-600">{successRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg Response Time:</span>
                    <span className="font-semibold text-blue-600">{avgResponseTime}ms</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Response Time Distribution</h3>
                <div className="space-y-1">
                  {responses.map((res, i) => (
                    <div key={res.id} className="flex items-center gap-2">
                      <div className="text-xs text-muted-foreground w-8">#{i + 1}</div>
                      <div className="flex-1">
                        <div
                          className="h-4 bg-blue-500 rounded"
                          style={{
                            width: `${Math.min((res.duration / Math.max(...responses.map(r => r.duration))) * 100, 100)}%`,
                          }}
                        />
                      </div>
                      <div className="text-xs font-mono w-16 text-right">{res.duration}ms</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Status Code Distribution</h3>
                <div className="space-y-2">
                  {Object.entries(
                    responses.reduce((acc, res) => {
                      const statusCategory = `${Math.floor(res.status / 100)}xx`;
                      acc[statusCategory] = (acc[statusCategory] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([status, count]) => (
                    <div key={status} className="flex items-center gap-2">
                      <Badge
                        variant={status === '2xx' ? 'default' : 'destructive'}
                        className="w-12"
                      >
                        {status}
                      </Badge>
                      <div className="flex-1">
                        <div
                          className={`h-4 rounded ${
                            status === '2xx' ? 'bg-green-500' : 'bg-red-500'
                          }`}
                          style={{
                            width: `${(count / responses.length) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-semibold w-12 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
