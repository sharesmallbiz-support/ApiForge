import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
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
import { useToast } from "@/hooks/use-toast";
import type { Workspace } from "@shared/schema";

interface ImportDialogProps {
  workspaceId: string;
  children?: React.ReactNode;
}

export function ImportDialog({ workspaceId, children }: ImportDialogProps) {
  const [openApiUrl, setOpenApiUrl] = useState("");
  const [curlCommand, setCurlCommand] = useState("");
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: workspacesData } = useQuery<{ workspaces: Workspace[] }>({
    queryKey: ["/api/workspaces"],
  });

  const importOpenApiMutation = useMutation({
    mutationFn: async (url: string) => {
      const response = await fetch("/api/collections/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, workspaceId }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to import OpenAPI");
      }
      return response.json();
    },
    onSuccess: async () => {
      try {
        await queryClient.refetchQueries({ queryKey: ["/api/workspaces"] });
        toast({
          title: "Import successful",
          description: "OpenAPI specification imported successfully.",
        });
        // Small delay to ensure React has time to re-render before closing dialog
        await new Promise(resolve => setTimeout(resolve, 100));
        setOpen(false);
        setOpenApiUrl("");
      } catch (error) {
        console.error('[OpenAPI Import] Refetch error:', error);
        toast({
          title: "Import successful",
          description: "Collection imported but UI may need manual refresh.",
        });
        setOpen(false);
        setOpenApiUrl("");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const importCurlMutation = useMutation({
    mutationFn: async (curl: string) => {
      console.log('[CURLImport] Parsing CURL command');
      const parsed = parseCurlCommand(curl);
      if (!parsed) {
        console.error('[CURLImport] Failed to parse CURL command');
        throw new Error("Invalid CURL command. Please check the format and try again.");
      }
      console.log('[CURLImport] Parsed:', parsed);

      // Find or create "CURL Imports" collection
      console.log('[CURLImport] Finding workspace:', workspaceId);
      const workspace = workspacesData?.workspaces.find(w => w.id === workspaceId);
      console.log('[CURLImport] Workspace:', workspace);
      let collection = workspace?.collections.find(c => c.name === "CURL Imports");
      console.log('[CURLImport] Existing collection:', collection);

      if (!collection) {
        console.log('[CURLImport] Creating new collection');
        const collectionsResponse = await fetch("/api/collections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "CURL Imports",
            description: "Requests imported from CURL commands",
            workspaceId,
          }),
        });

        if (!collectionsResponse.ok) {
          const errorData = await collectionsResponse.json().catch(() => ({}));
          console.error('[CURLImport] Failed to create collection:', errorData);
          throw new Error(errorData.message || "Failed to create collection");
        }
        const data = await collectionsResponse.json();
        console.log('[CURLImport] Collection created:', data);
        collection = data.collection;
      }

      // Find or create "Imported Requests" folder
      let folder = collection.folders?.find(f => f.name === "Imported Requests");
      console.log('[CURLImport] Existing folder:', folder);

      if (!folder) {
        console.log('[CURLImport] Creating new folder in collection:', collection.id);
        const folderResponse = await fetch("/api/folders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Imported Requests",
            collectionId: collection.id,
          }),
        });

        if (!folderResponse.ok) {
          const errorData = await folderResponse.json().catch(() => ({}));
          console.error('[CURLImport] Failed to create folder:', errorData);
          throw new Error(errorData.message || "Failed to create folder");
        }
        const data = await folderResponse.json();
        console.log('[CURLImport] Folder created:', data);
        folder = data.folder;
      }

      // Create the request
      const requestName = `${parsed.method} ${new URL(parsed.url).pathname}`;
      console.log('[CURLImport] Creating request in folder:', folder.id);
      const requestResponse = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: requestName,
          method: parsed.method,
          url: parsed.url,
          headers: parsed.headers,
          params: [],
          body: parsed.body ? { type: "json", content: parsed.body } : undefined,
          folderId: folder.id,
        }),
      });

      if (!requestResponse.ok) {
        const errorData = await requestResponse.json().catch(() => ({}));
        console.error('[CURLImport] Failed to create request:', errorData);
        throw new Error(errorData.message || "Failed to create request");
      }
      const result = await requestResponse.json();
      console.log('[CURLImport] Request created:', result);
      return result;
    },
    onSuccess: async () => {
      console.log('[CURLImport] Success, refetching queries');
      try {
        const result = await queryClient.refetchQueries({ queryKey: ["/api/workspaces"] });
        console.log('[CURLImport] Refetch complete, result:', result);
        toast({
          title: "CURL imported",
          description: "Request created successfully from CURL command.",
        });
        // Small delay to ensure React has time to re-render before closing dialog
        await new Promise(resolve => setTimeout(resolve, 100));
        setOpen(false);
        setCurlCommand("");
      } catch (error) {
        console.error('[CURLImport] Refetch error:', error);
        toast({
          title: "CURL imported",
          description: "Request created but UI may need manual refresh.",
        });
        setOpen(false);
        setCurlCommand("");
      }
    },
    onError: (error: Error) => {
      console.error('[CURLImport] Error:', error);
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
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
