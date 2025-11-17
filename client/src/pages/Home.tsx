import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { EnvironmentSelector } from "@/components/EnvironmentSelector";
import { RequestBuilder } from "@/components/RequestBuilder";
import { ResponseViewer } from "@/components/ResponseViewer";
import { EnvironmentEditor } from "@/components/EnvironmentEditor";
import { GettingStarted } from "@/components/GettingStarted";
import { UserGuide } from "@/components/UserGuide";
import { DebugPanel } from "@/components/DebugPanel";
import { Play, Globe, HelpCircle, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { createSampleData } from "@/lib/sample-data";
import { useToast } from "@/hooks/use-toast";
import { useDebug } from "@/contexts/DebugContext";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import type { Request, ExecutionResult, Workspace } from "@shared/schema";

export default function Home() {
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [selectedEnvironmentForEdit, setSelectedEnvironmentForEdit] = useState<string | null>(null);
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>("");
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [showGettingStarted, setShowGettingStarted] = useState(false);
  const [showUserGuide, setShowUserGuide] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { addRequest, addResponse, addError } = useDebug();

  // Check if this is the first time user is opening the app
  useEffect(() => {
    const hasSeenWalkthrough = localStorage.getItem("apispark-seen-walkthrough");
    if (!hasSeenWalkthrough) {
      setShowGettingStarted(true);
      localStorage.setItem("apispark-seen-walkthrough", "true");
    }
  }, []);

  const { data: requestData } = useQuery<{ request: Request }>({
    queryKey: ["/api/requests", selectedRequestId],
    enabled: !!selectedRequestId,
  });

  const { data: workspacesData } = useQuery<{ workspaces: Workspace[] }>({
    queryKey: ["/api/workspaces"],
  });

  const { data: environmentsData } = useQuery<{ environments: any[] }>({
    queryKey: ["/api/environments"],
  });

  // Auto-select the first environment when environments load
  useEffect(() => {
    if (environmentsData?.environments && environmentsData.environments.length > 0 && !selectedEnvironment) {
      setSelectedEnvironment(environmentsData.environments[0].id);
    }
  }, [environmentsData, selectedEnvironment]);

  const executeMutation = useMutation({
    mutationFn: async () => {
      if (!selectedRequestId) throw new Error("No request selected");

      const startTime = performance.now();
      const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      try {
        // Get current environment data if one is selected
        const currentEnvironment = selectedEnvironment
          ? environmentsData?.environments.find(e => e.id === selectedEnvironment)
          : undefined;

        const req = requestData?.request;

        const response = await apiRequest(
          "POST",
          `/api/requests/${selectedRequestId}/execute`,
          {
            environmentId: selectedEnvironment || undefined,
            request: req, // Send request data for localStorage mode
            environment: currentEnvironment // Send environment data for localStorage mode
          }
        );

        const duration = performance.now() - startTime;
        const data = await response.json();

        // Capture request details with resolved values from server
        const resolvedRequest = data.resolvedRequest;
        console.log('Resolved request from server:', resolvedRequest);
        if (req) {
          // Convert headers array to Record<string, string> for debug panel
          const headersRecord: Record<string, string> = {};
          const headersToUse = resolvedRequest?.headers || req.headers || [];
          if (Array.isArray(headersToUse)) {
            headersToUse.forEach((h: any) => {
              if (h.enabled !== false && h.key && h.value) {
                headersRecord[h.key] = h.value;
              }
            });
          }

          // Use resolved URL if available, otherwise fall back to original
          const urlToLog = resolvedRequest?.url || req.url;

          addRequest({
            id: requestId,
            timestamp: new Date(),
            method: req.method,
            url: urlToLog,
            headers: headersRecord,
            body: resolvedRequest?.body || req.body,
            environmentId: selectedEnvironment || undefined,
          });
        }

        // Capture response
        addResponse({
          id: `res-${Date.now()}`,
          requestId,
          timestamp: new Date(),
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: data.result,
          duration,
        });

        return data;
      } catch (error) {
        const duration = performance.now() - startTime;

        // Capture error
        addError({
          id: `err-${Date.now()}`,
          requestId,
          timestamp: new Date(),
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        });

        // Also add a synthetic error response
        addResponse({
          id: `res-${Date.now()}`,
          requestId,
          timestamp: new Date(),
          status: 0,
          statusText: 'Network Error',
          headers: {},
          body: { error: error instanceof Error ? error.message : 'Unknown error' },
          duration,
        });

        throw error;
      }
    },
    onSuccess: (data) => {
      setExecutionResult(data.result);
    },
  });

  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  const handleSend = () => {
    executeMutation.mutate();
  };

  const handleRequestSelect = (requestId: string) => {
    setSelectedRequestId(requestId);
    setSelectedEnvironmentForEdit(null);
  };

  const handleEnvironmentSelect = (environmentId: string) => {
    setSelectedEnvironmentForEdit(environmentId);
    setSelectedRequestId(null);
  };

  const handleCreateSampleCollection = async () => {
    try {
      // Get the first workspace
      const workspace = workspacesData?.workspaces[0];
      if (!workspace) {
        toast({
          title: "No workspace found",
          description: "Please create a workspace first",
          variant: "destructive",
        });
        return;
      }

      const sampleData = createSampleData(workspace.id);

      // Create collection
      const collectionResponse = await apiRequest("POST", "/api/collections", sampleData.collection);
      const collectionData = await collectionResponse.json();
      const collectionId = collectionData.collection.id;

      // Create folders and requests
      for (const folder of sampleData.folders) {
        const folderResponse = await apiRequest("POST", "/api/folders", {
          ...folder,
          collectionId,
        });
        const folderData = await folderResponse.json();
        const folderId = folderData.folder.id;

        // Create requests in this folder
        for (const request of folder.requests) {
          await apiRequest("POST", "/api/requests", {
            ...request,
            folderId,
          });
        }
      }

      // Create environment and set collection scope
      const envData = {
        ...sampleData.environment,
        variables: sampleData.environment.variables.map(v => ({
          ...v,
          scopeId: v.scope === "collection" ? collectionId : v.scopeId,
        })),
      };
      await apiRequest("POST", "/api/environments", envData);

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces"] });
      queryClient.invalidateQueries({ queryKey: ["/api/environments"] });

      toast({
        title: "Sample collection created! 🎉",
        description: "Check the sidebar for example requests you can try",
      });
    } catch (error) {
      toast({
        title: "Failed to create sample collection",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar
          onRequestSelect={handleRequestSelect}
          selectedRequestId={selectedRequestId || undefined}
          onEnvironmentSelect={handleEnvironmentSelect}
          selectedEnvironmentId={selectedEnvironmentForEdit || undefined}
        />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-3 border-b">
            <div className="flex items-center gap-2">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <div className="flex items-center gap-2">
                <Play className="h-5 w-5 text-primary" />
                <h1 className="text-lg font-semibold">ApiSpark</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUserGuide(true)}
                className="gap-2"
              >
                <HelpCircle className="h-4 w-4" />
                Help
              </Button>
              <EnvironmentSelector
                value={selectedEnvironment}
                onChange={setSelectedEnvironment}
              />
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-hidden">
            {selectedEnvironmentForEdit ? (
              <EnvironmentEditor environmentId={selectedEnvironmentForEdit} />
            ) : selectedRequestId && requestData ? (
              <PanelGroup direction="horizontal" className="h-full">
                <Panel defaultSize={50} minSize={30}>
                  <div className="h-full border-r">
                    <RequestBuilder
                      request={requestData.request}
                      onSend={handleSend}
                      isExecuting={executeMutation.isPending}
                    />
                  </div>
                </Panel>
                <PanelResizeHandle className="w-1 bg-border hover:bg-primary transition-colors" />
                <Panel defaultSize={50} minSize={30}>
                  <div className="h-full bg-card">
                    {executionResult ? (
                      <ResponseViewer
                        statusCode={executionResult.status}
                        responseTime={executionResult.time}
                        size={executionResult.size}
                        body={JSON.stringify(executionResult.body, null, 2)}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <div className="text-center space-y-2">
                          <Play className="h-12 w-12 mx-auto opacity-50" />
                          <p className="text-sm">Send a request to see the response</p>
                        </div>
                      </div>
                    )}
                  </div>
                </Panel>
              </PanelGroup>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center space-y-6 max-w-md px-4">
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <Rocket className="h-20 w-20 text-primary opacity-40" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xl font-semibold text-foreground">
                      Welcome to ApiSpark!
                    </p>
                    <p className="text-sm">
                      Select a request from the sidebar to get started, or explore these quick actions:
                    </p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <Button
                      variant="default"
                      size="lg"
                      onClick={() => setShowGettingStarted(true)}
                      className="gap-2"
                    >
                      <Rocket className="h-4 w-4" />
                      Quick Start Guide
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={handleCreateSampleCollection}
                      className="gap-2"
                    >
                      <Play className="h-4 w-4" />
                      Load Sample Collection
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowUserGuide(true)}
                      className="gap-2"
                    >
                      <HelpCircle className="h-4 w-4" />
                      View User Guide
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Dialogs */}
      <GettingStarted
        open={showGettingStarted}
        onOpenChange={setShowGettingStarted}
        onOpenUserGuide={() => {
          setShowGettingStarted(false);
          setShowUserGuide(true);
        }}
        onCreateSample={handleCreateSampleCollection}
      />
      <UserGuide open={showUserGuide} onOpenChange={setShowUserGuide} />

      {/* Debug Panel */}
      <DebugPanel />
    </SidebarProvider>
  );
}
