import { Search, Plus, FolderPlus, Settings } from "lucide-react";
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
import { CollectionItem } from "./CollectionItem";
import { ImportDialog } from "./ImportDialog";
import type { Collection } from "@shared/schema";

interface AppSidebarProps {
  onRequestSelect?: (requestId: string) => void;
  selectedRequestId?: string;
}

export function AppSidebar({ onRequestSelect, selectedRequestId }: AppSidebarProps) {
  const { data } = useQuery<{ collections: Collection[] }>({
    queryKey: ["/api/collections"],
  });

  const collections = data?.collections || [];

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Collections</h2>
          <Button variant="ghost" size="icon" data-testid="button-settings">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search collections..."
            className="pl-9"
            data-testid="input-search-collections"
          />
        </div>
      </SidebarHeader>
      <SidebarContent className="p-4">
        <SidebarGroup>
          <SidebarGroupLabel className="mb-2">
            <div className="flex items-center justify-between w-full">
              <span>My Collections</span>
              <div className="flex gap-1">
                <ImportDialog>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Plus className="h-3 w-3" />
                  </Button>
                </ImportDialog>
                <Button variant="ghost" size="icon" className="h-6 w-6" data-testid="button-new-folder">
                  <FolderPlus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent className="space-y-1">
            {collections.map((collection) => (
              <CollectionItem
                key={collection.id}
                name={collection.name}
                type="folder"
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
      </SidebarContent>
    </Sidebar>
  );
}
