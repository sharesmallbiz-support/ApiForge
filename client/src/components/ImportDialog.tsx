import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUp, Link2, Terminal } from "lucide-react";
import { parseCurlCommand } from "@shared/curl-parser";

interface ImportDialogProps {
  workspaceId: string;
  children?: React.ReactNode;
}

export function ImportDialog({ workspaceId, children }: ImportDialogProps) {
  const [openApiUrl, setOpenApiUrl] = useState("");
  const [curlCommand, setCurlCommand] = useState("");
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const importOpenApiMutation = useMutation({
    mutationFn: async (url: string) => {
      const response = await fetch("/api/collections/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, workspaceId }),
      });
      if (!response.ok) throw new Error("Failed to import OpenAPI");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces"] });
      setOpen(false);
      setOpenApiUrl("");
    },
  });

  const importCurlMutation = useMutation({
    mutationFn: async (curl: string) => {
      const parsed = parseCurlCommand(curl);
      if (!parsed) throw new Error("Invalid CURL command");

      // First, get or create a collection for CURL imports
      const collectionsResponse = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "CURL Imports",
          description: "Requests imported from CURL commands",
          workspaceId,
        }),
      });

      if (!collectionsResponse.ok) throw new Error("Failed to create collection");
      const { collection } = await collectionsResponse.json();

      // Create a folder
      const folderResponse = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Imported Requests",
          collectionId: collection.id,
        }),
      });

      if (!folderResponse.ok) throw new Error("Failed to create folder");
      const { folder } = await folderResponse.json();

      // Create the request
      const requestResponse = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${parsed.method} ${new URL(parsed.url).pathname}`,
          method: parsed.method,
          url: parsed.url,
          headers: parsed.headers,
          params: [],
          body: parsed.body ? { type: "json", content: parsed.body } : undefined,
          folderId: folder.id,
        }),
      });

      if (!requestResponse.ok) throw new Error("Failed to create request");
      return requestResponse.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces"] });
      setOpen(false);
      setCurlCommand("");
    },
  });

  const handleOpenApiImport = () => {
    if (openApiUrl.trim()) {
      importOpenApiMutation.mutate(openApiUrl);
    }
  };

  const handleCurlImport = () => {
    if (curlCommand.trim()) {
      importCurlMutation.mutate(curlCommand);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button data-testid="button-import">
            <FileUp className="h-4 w-4 mr-2" />
            Import OpenAPI
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import API Specification</DialogTitle>
          <DialogDescription>
            Import from OpenAPI, CURL command, or upload a file to create requests.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="openapi" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="openapi" data-testid="tab-import-openapi">
              <Link2 className="h-4 w-4 mr-2" />
              OpenAPI
            </TabsTrigger>
            <TabsTrigger value="curl" data-testid="tab-import-curl">
              <Terminal className="h-4 w-4 mr-2" />
              CURL
            </TabsTrigger>
            <TabsTrigger value="file" data-testid="tab-import-file">
              <FileUp className="h-4 w-4 mr-2" />
              File
            </TabsTrigger>
          </TabsList>

          <TabsContent value="openapi" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="openapi-url">OpenAPI URL</Label>
              <Input
                id="openapi-url"
                value={openApiUrl}
                onChange={(e) => setOpenApiUrl(e.target.value)}
                placeholder="https://api.example.com/openapi.json"
                className="font-mono text-sm"
                data-testid="input-openapi-url"
              />
            </div>
            <Button
              onClick={handleOpenApiImport}
              className="w-full"
              disabled={!openApiUrl.trim() || importOpenApiMutation.isPending}
              data-testid="button-import-openapi"
            >
              {importOpenApiMutation.isPending ? "Importing..." : "Import OpenAPI"}
            </Button>
          </TabsContent>

          <TabsContent value="curl" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="curl-command">CURL Command</Label>
              <Textarea
                id="curl-command"
                value={curlCommand}
                onChange={(e) => setCurlCommand(e.target.value)}
                placeholder="curl -X POST https://api.example.com/endpoint -H 'Content-Type: application/json' -d '{&quot;key&quot;: &quot;value&quot;}'"
                className="font-mono text-sm min-h-[120px]"
                data-testid="textarea-curl-command"
              />
            </div>
            <Button
              onClick={handleCurlImport}
              className="w-full"
              disabled={!curlCommand.trim() || importCurlMutation.isPending}
              data-testid="button-import-curl"
            >
              {importCurlMutation.isPending ? "Importing..." : "Import CURL"}
            </Button>
          </TabsContent>

          <TabsContent value="file" className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center hover-elevate cursor-pointer">
              <FileUp className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                OpenAPI JSON files only
              </p>
              <input
                type="file"
                accept=".json"
                className="hidden"
                data-testid="input-file-upload"
              />
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
