import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { EnvironmentSelector } from "@/components/EnvironmentSelector";
import { RequestBuilder } from "@/components/RequestBuilder";
import { ResponseViewer } from "@/components/ResponseViewer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [showResponse, setShowResponse] = useState(false);

  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  const handleSend = () => {
    console.log("Sending request...");
    setShowResponse(true);
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
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
              <EnvironmentSelector />
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-hidden">
            <div className="grid grid-cols-2 h-full">
              <div className="border-r">
                <RequestBuilder onSend={handleSend} />
              </div>
              <div className="bg-card">
                {showResponse ? (
                  <ResponseViewer />
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
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
