import { Search, Plus, FolderPlus, Settings } from "lucide-react";
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

export function AppSidebar() {
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
            <CollectionItem
              name="User Management API"
              type="folder"
              hasChildren={true}
            >
              <CollectionItem
                name="Authentication"
                type="folder"
                hasChildren={true}
              >
                <CollectionItem
                  name="Login"
                  type="request"
                  method="POST"
                  onClick={() => console.log("Login clicked")}
                />
                <CollectionItem
                  name="Logout"
                  type="request"
                  method="POST"
                  onClick={() => console.log("Logout clicked")}
                />
              </CollectionItem>
              <CollectionItem
                name="Users"
                type="folder"
                hasChildren={true}
              >
                <CollectionItem
                  name="List Users"
                  type="request"
                  method="GET"
                  isActive={true}
                  onClick={() => console.log("List users clicked")}
                />
                <CollectionItem
                  name="Create User"
                  type="request"
                  method="POST"
                  onClick={() => console.log("Create user clicked")}
                />
                <CollectionItem
                  name="Update User"
                  type="request"
                  method="PUT"
                  onClick={() => console.log("Update user clicked")}
                />
                <CollectionItem
                  name="Delete User"
                  type="request"
                  method="DELETE"
                  onClick={() => console.log("Delete user clicked")}
                />
              </CollectionItem>
            </CollectionItem>
            <CollectionItem
              name="E-commerce API"
              type="folder"
              hasChildren={true}
            >
              <CollectionItem
                name="Get Products"
                type="request"
                method="GET"
                onClick={() => console.log("Products clicked")}
              />
            </CollectionItem>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
