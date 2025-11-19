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
import { apiRequest } from "@/lib/queryClient";
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
      const response = await apiRequest("POST", "/api/collections/import", {
        url,
        workspaceId,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to import OpenAPI");
      }
      return response.json();
    },
    onSuccess: async (data) => {
      try {
        console.log('[OpenAPI Import] Server returned:', data);
        
        // The server created the collection in its own storage, but we need to save it to localStorage
        // The collection data includes all folders and requests
        if (data.collection) {
          const collection = data.collection;
          
          // Create collection in localStorage
          const collectionResponse = await apiRequest("POST", "/api/collections", {
            name: collection.name,
            description: collection.description,
            workspaceId: workspaceId,
          });
          const localCollection = (await collectionResponse.json()).collection;
          console.log('[OpenAPI Import] Created collection in localStorage:', localCollection);
          
          // Create folders and requests in localStorage
          for (const folder of collection.folders || []) {
            const folderResponse = await apiRequest("POST", "/api/folders", {
              name: folder.name,
              collectionId: localCollection.id,
            });
            const localFolder = (await folderResponse.json()).folder;
            console.log('[OpenAPI Import] Created folder:', localFolder);
            
            // Create requests in this folder
            for (const request of folder.requests || []) {
              await apiRequest("POST", "/api/requests", {
                name: request.name,
                method: request.method,
                url: request.url,
                headers: request.headers || [],
                params: request.params || [],
                body: request.body,
                folderId: localFolder.id,
              });
            }
          }
        }
        
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
        console.error('[OpenAPI Import] Error saving to localStorage:', error);
        toast({
          title: "Import failed",
          description: error instanceof Error ? error.message : "Failed to save imported data",
          variant: "destructive",
        });
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
        throw new Error(
          "Failed to parse CURL command. Make sure it:\n" +
          "• Starts with 'curl'\n" +
          "• Contains a valid URL (http:// or https://)\n" +
          "• Has proper quoting for headers and data\n\n" +
          "Check the browser console for detailed error messages."
        );
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
        const collectionsResponse = await apiRequest("POST", "/api/collections", {
          name: "CURL Imports",
          description: "Requests imported from CURL commands",
          workspaceId,
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
        const folderResponse = await apiRequest("POST", "/api/folders", {
          name: "Imported Requests",
          collectionId: collection.id,
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

      // Determine body type from Content-Type header or content
      let bodyType: "json" | "form" | "raw" = "json";
      if (parsed.body) {
        const contentTypeHeader = parsed.headers.find(h =>
          h.key.toLowerCase() === 'content-type'
        );

        if (contentTypeHeader) {
          const contentType = contentTypeHeader.value.toLowerCase();
          if (contentType.includes('application/x-www-form-urlencoded') ||
              contentType.includes('multipart/form-data')) {
            bodyType = "form";
          } else if (!contentType.includes('application/json')) {
            bodyType = "raw";
          }
        } else {
          // Auto-detect based on content
          const trimmed = parsed.body.trim();
          if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
            bodyType = "raw";
          }
        }
      }

      const requestResponse = await apiRequest("POST", "/api/requests", {
        name: requestName,
        method: parsed.method,
        url: parsed.url,
        headers: parsed.headers,
        params: parsed.params || [],
        body: parsed.body ? { type: bodyType, content: parsed.body } : undefined,
        folderId: folder.id,
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
        // Check cache before refetch
        const beforeData = queryClient.getQueryData(["/api/workspaces"]);
        console.log('[CURLImport] Cache before refetch:', beforeData);

        // Check localStorage directly
        const localStorageCollections = localStorage.getItem('apiforge-collections');
        const parsedCollections = localStorageCollections ? JSON.parse(localStorageCollections) : null;
        console.log('[CURLImport] localStorage collections count:', parsedCollections?.length || 0);
        console.log('[CURLImport] localStorage collections:', parsedCollections);
        if (parsedCollections) {
          parsedCollections.forEach((c: any, idx: number) => {
            console.log(`[CURLImport] Collection ${idx}:`, c.name, 'workspaceId:', c.workspaceId);
          });
        }

        const result = await queryClient.refetchQueries({ queryKey: ["/api/workspaces"] });
        console.log('[CURLImport] Refetch complete, result:', result);

        // Check cache after refetch
        const afterData = queryClient.getQueryData(["/api/workspaces"]);
        console.log('[CURLImport] Cache after refetch:', afterData);

        // Log the workspaces array to see collection count
        if (afterData && typeof afterData === 'object' && 'workspaces' in afterData) {
          const workspaces = (afterData as any).workspaces;
          console.log('[CURLImport] Workspaces count:', workspaces.length);
          workspaces.forEach((ws: any, idx: number) => {
            console.log(`[CURLImport] Workspace ${idx}:`, ws.name, 'Collections:', ws.collections?.length || 0);
          });
        }

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
