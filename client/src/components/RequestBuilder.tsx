import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Save } from "lucide-react";
import { KeyValueTable } from "./KeyValueTable";
import type { Request, KeyValue } from "@shared/schema";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

interface RequestBuilderProps {
  request?: Request;
  onSend?: () => void;
}

export function RequestBuilder({ request, onSend }: RequestBuilderProps) {
  const [method, setMethod] = useState<HttpMethod>(request?.method || "GET");
  const [url, setUrl] = useState(request?.url || "");
  const [headers, setHeaders] = useState<KeyValue[]>(request?.headers || []);
  const [params, setParams] = useState<KeyValue[]>(request?.params || []);
  const [body, setBody] = useState(request?.body?.content || "");
  const [script, setScript] = useState(request?.script || "");
  const [hasChanges, setHasChanges] = useState(false);
  const queryClient = useQueryClient();

  const updateRequestMutation = useMutation({
    mutationFn: async (data: Partial<Request>) => {
      if (!request?.id) return;
      const response = await fetch(`/api/requests/${request.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update request");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces"] });
      setHasChanges(false);
    },
  });

  // Update form when request changes
  useEffect(() => {
    if (request) {
      setMethod(request.method);
      setUrl(request.url);
      setHeaders(request.headers || []);
      setParams(request.params || []);
      setBody(request.body?.content || "");
      setScript(request.script || "");
      setHasChanges(false);
    }
  }, [request]);

  // Track changes
  useEffect(() => {
    if (!request) return;
    const changed =
      method !== request.method ||
      url !== request.url ||
      JSON.stringify(headers) !== JSON.stringify(request.headers || []) ||
      JSON.stringify(params) !== JSON.stringify(request.params || []) ||
      body !== (request.body?.content || "") ||
      script !== (request.script || "");
    setHasChanges(changed);
  }, [method, url, headers, params, body, script, request]);

  const handleSave = () => {
    if (!request?.id || !hasChanges) return;
    updateRequestMutation.mutate({
      method,
      url,
      headers,
      params,
      body: body ? { type: "json", content: body } : undefined,
      script,
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-2 p-4 border-b">
        <Select value={method} onValueChange={(v) => setMethod(v as HttpMethod)}>
          <SelectTrigger className="w-32" data-testid="select-method">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="GET">GET</SelectItem>
            <SelectItem value="POST">POST</SelectItem>
            <SelectItem value="PUT">PUT</SelectItem>
            <SelectItem value="DELETE">DELETE</SelectItem>
            <SelectItem value="PATCH">PATCH</SelectItem>
          </SelectContent>
        </Select>
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter request URL"
          className="flex-1 font-mono text-sm"
          data-testid="input-url"
        />
        <Button
          onClick={handleSave}
          disabled={!hasChanges || updateRequestMutation.isPending}
          variant="outline"
          data-testid="button-save"
        >
          <Save className="h-4 w-4 mr-2" />
          {updateRequestMutation.isPending ? "Saving..." : "Save"}
        </Button>
        <Button onClick={onSend} data-testid="button-send">
          <Send className="h-4 w-4 mr-2" />
          Send
        </Button>
      </div>

      <Tabs defaultValue="params" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-4 w-fit">
          <TabsTrigger value="params" data-testid="tab-params">Params</TabsTrigger>
          <TabsTrigger value="headers" data-testid="tab-headers">Headers</TabsTrigger>
          <TabsTrigger value="body" data-testid="tab-body">Body</TabsTrigger>
          <TabsTrigger value="auth" data-testid="tab-auth">Auth</TabsTrigger>
          <TabsTrigger value="scripts" data-testid="tab-scripts">Scripts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="params" className="flex-1 p-4 overflow-auto">
          <KeyValueTable
            title="Query Parameters"
            items={params}
            onChange={setParams}
            onAdd={() => setParams([...params, { key: "", value: "", enabled: true }])}
          />
        </TabsContent>

        <TabsContent value="headers" className="flex-1 p-4 overflow-auto">
          <KeyValueTable
            title="Headers"
            items={headers}
            onChange={setHeaders}
            onAdd={() => setHeaders([...headers, { key: "", value: "", enabled: true }])}
          />
        </TabsContent>
        
        <TabsContent value="body" className="flex-1 p-4 overflow-auto">
          <div className="space-y-4">
            <Select defaultValue="json">
              <SelectTrigger className="w-48" data-testid="select-body-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="form">Form Data</SelectItem>
                <SelectItem value="raw">Raw</SelectItem>
              </SelectContent>
            </Select>
            <textarea
              className="w-full min-h-[300px] p-3 rounded-md border bg-card text-card-foreground font-mono text-sm"
              placeholder='{\n  "key": "value"\n}'
              value={body}
              onChange={(e) => setBody(e.target.value)}
              data-testid="textarea-body"
            />
          </div>
        </TabsContent>
        
        <TabsContent value="auth" className="flex-1 p-4 overflow-auto">
          <div className="space-y-4">
            <Select defaultValue="bearer">
              <SelectTrigger className="w-48" data-testid="select-auth-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bearer">Bearer Token</SelectItem>
                <SelectItem value="basic">Basic Auth</SelectItem>
                <SelectItem value="apikey">API Key</SelectItem>
              </SelectContent>
            </Select>
            <div className="space-y-2">
              <label className="text-sm font-medium">Token</label>
              <Input
                type="password"
                placeholder="Enter token"
                className="font-mono text-sm"
                data-testid="input-token"
              />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="scripts" className="flex-1 p-4 overflow-auto">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Post-Response Script</label>
                <span className="text-xs text-muted-foreground">JavaScript to run after receiving the response</span>
              </div>
              <textarea
                className="w-full min-h-[400px] p-3 rounded-md border bg-card text-card-foreground font-mono text-sm"
                placeholder={`// Example: Extract token from response and save to environment
const response = pm.response.json();
if (response.token) {
  pm.environment.set("token", response.token);
  console.log("Token saved:", response.token);
}

// Available APIs:
// - pm.response.json() - Get response body as JSON
// - pm.response.text() - Get response body as text
// - pm.response.status - Get status code
// - pm.response.headers - Get response headers
// - pm.environment.set(key, value) - Set environment variable
// - pm.environment.get(key) - Get environment variable`}
                value={script}
                onChange={(e) => setScript(e.target.value)}
                data-testid="textarea-script"
              />
            </div>
            <div className="p-3 rounded-md bg-muted/50 border">
              <p className="text-xs text-muted-foreground">
                <strong>Tip:</strong> Use post-response scripts to extract data from API responses and save them as environment variables. 
                This is useful for chaining requests together (e.g., save auth token from login, use in subsequent requests).
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
