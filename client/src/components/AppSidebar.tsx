import { useState } from "react";
import { Search, Plus, FolderPlus, Settings, FolderOpen, Globe, Briefcase, ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CollectionItem } from "./CollectionItem";
import { EnvironmentItem } from "./EnvironmentItem";
import { ImportDialog } from "./ImportDialog";
import type { Workspace, Collection, Environment } from "@shared/schema";

interface AppSidebarProps {
  onRequestSelect?: (requestId: string) => void;
  selectedRequestId?: string;
  onEnvironmentSelect?: (environmentId: string) => void;
  selectedEnvironmentId?: string;
}

type ViewMode = "collections" | "environments";

export function AppSidebar({ 
  onRequestSelect, 
  selectedRequestId,
  onEnvironmentSelect,
  selectedEnvironmentId,
}: AppSidebarProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("collections");
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  
  const { data: workspacesData } = useQuery<{ workspaces: Workspace[] }>({
    queryKey: ["/api/workspaces"],
  });

  const { data: environmentsData } = useQuery<{ environments: Environment[] }>({
    queryKey: ["/api/environments"],
  });

  const workspaces = workspacesData?.workspaces || [];
  const environments = environmentsData?.environments || [];
  
  // Auto-select first workspace if none selected
  const currentWorkspace = selectedWorkspaceId 
    ? workspaces.find(w => w.id === selectedWorkspaceId) 
    : workspaces[0];
  
  // Get collections for the current workspace
  const collections = currentWorkspace?.collections || [];

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="flex items-center gap-2 hover-elevate px-2 h-auto"
                data-testid="button-workspace-selector"
              >
                <Briefcase className="h-5 w-5" />
                <h2 className="text-lg font-semibold">
                  {currentWorkspace?.name || "My Workspace"}
                </h2>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {workspaces.map((workspace) => (
                <DropdownMenuItem
                  key={workspace.id}
                  onClick={() => setSelectedWorkspaceId(workspace.id)}
                  data-testid={`workspace-option-${workspace.id}`}
                >
                  <Briefcase className="h-4 w-4 mr-2" />
                  {workspace.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" data-testid="button-settings">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
        
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="mb-4">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger 
              value="collections" 
              className="gap-2"
              data-testid="tab-collections"
            >
              <FolderOpen className="h-4 w-4" />
              <span>Collections</span>
            </TabsTrigger>
            <TabsTrigger 
              value="environments" 
              className="gap-2"
              data-testid="tab-environments"
            >
              <Globe className="h-4 w-4" />
              <span>Environments</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={viewMode === "collections" ? "Search collections..." : "Search environments..."}
            className="pl-9"
            data-testid="input-search"
          />
        </div>
      </SidebarHeader>
      
      <SidebarContent className="p-4">
        {viewMode === "collections" ? (
          <SidebarGroup>
            <SidebarGroupLabel className="mb-2">
              <div className="flex items-center justify-between w-full">
                <span>Collections</span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-6 w-6" data-testid="button-add-collection">
                    <Plus className="h-3 w-3" />
                  </Button>
                  <ImportDialog>
                    <Button variant="ghost" size="icon" className="h-6 w-6" data-testid="button-import">
                      <FolderPlus className="h-3 w-3" />
                    </Button>
                  </ImportDialog>
                </div>
              </div>
            </SidebarGroupLabel>
            <SidebarGroupContent className="space-y-1">
              {collections.map((collection) => (
                <CollectionItem
                  key={collection.id}
                  name={collection.name}
                  type="collection"
                  hasChildren={collection.folders.length > 0}
                >
                  {collection.folders.map((folder) => (
                    <CollectionItem
                      key={folder.id}
                      name={folder.name}
                      type="folder"
                      hasChildren={folder.requests.length > 0}
                    >
                      {folder.requests.map((request) => (
                        <CollectionItem
                          key={request.id}
                          name={request.name}
                          type="request"
                          method={request.method}
                          isActive={selectedRequestId === request.id}
                          onClick={() => onRequestSelect?.(request.id)}
                        />
                      ))}
                    </CollectionItem>
                  ))}
                </CollectionItem>
              ))}
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          <SidebarGroup>
            <SidebarGroupLabel className="mb-2">
              <div className="flex items-center justify-between w-full">
                <span>My Environments</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6"
                  data-testid="button-add-environment"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </SidebarGroupLabel>
            <SidebarGroupContent className="space-y-1">
              {environments.map((environment) => (
                <EnvironmentItem
                  key={environment.id}
                  id={environment.id}
                  name={environment.name}
                  isActive={selectedEnvironmentId === environment.id}
                  onClick={() => onEnvironmentSelect?.(environment.id)}
                />
              ))}
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
