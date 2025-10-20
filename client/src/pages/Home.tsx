import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { EnvironmentSelector } from "@/components/EnvironmentSelector";
import { RequestBuilder } from "@/components/RequestBuilder";
import { ResponseViewer } from "@/components/ResponseViewer";
import { EnvironmentEditor } from "@/components/EnvironmentEditor";
import { Play, Globe } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Request, ExecutionResult } from "@shared/schema";

export default function Home() {
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [selectedEnvironmentForEdit, setSelectedEnvironmentForEdit] = useState<string | null>(null);
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>("");
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);

  const { data: requestData } = useQuery<{ request: Request }>({
    queryKey: ["/api/requests", selectedRequestId],
    enabled: !!selectedRequestId,
  });

  const executeMutation = useMutation({
    mutationFn: async () => {
      if (!selectedRequestId) throw new Error("No request selected");
      const response = await apiRequest(
        "POST",
        `/api/requests/${selectedRequestId}/execute`,
        { environmentId: selectedEnvironment || undefined }
      );
      return response.json();
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
                <h1 className="text-lg font-semibold">API Tester</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
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
              <div className="grid grid-cols-2 h-full">
                <div className="border-r">
                  <RequestBuilder 
                    request={requestData.request}
                    onSend={handleSend} 
                  />
                </div>
                <div className="bg-card">
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
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <Play className="h-16 w-16 opacity-30" />
                    <Globe className="h-16 w-16 opacity-30" />
                  </div>
                  <p className="text-lg font-medium">Select a request or environment to get started</p>
                  <p className="text-sm">Choose from the sidebar to begin</p>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
