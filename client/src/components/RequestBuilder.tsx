import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send } from "lucide-react";
import { KeyValueTable } from "./KeyValueTable";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

interface RequestBuilderProps {
  onSend?: () => void;
}

export function RequestBuilder({ onSend }: RequestBuilderProps) {
  const [method, setMethod] = useState<HttpMethod>("GET");
  const [url, setUrl] = useState("https://api.example.com/users");

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
        </TabsList>
        
        <TabsContent value="params" className="flex-1 p-4 overflow-auto">
          <KeyValueTable
            title="Query Parameters"
            onAdd={() => console.log("Add param")}
          />
        </TabsContent>
        
        <TabsContent value="headers" className="flex-1 p-4 overflow-auto">
          <KeyValueTable
            title="Headers"
            onAdd={() => console.log("Add header")}
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
      </Tabs>
    </div>
  );
}
