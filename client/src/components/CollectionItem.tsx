import { ChevronDown, ChevronRight, Folder, FileText, Plus, Trash2, MoreVertical } from "lucide-react";
import { HttpMethodBadge } from "./HttpMethodBadge";
import type { Collection, Folder as FolderType } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

interface Request {
  id: string;
  name: string;
  method: HttpMethod;
  url: string;
}

interface CollectionItemProps {
  name: string;
  type: "workspace" | "collection" | "folder" | "request";
  method?: HttpMethod;
  isActive?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
  hasChildren?: boolean;
  icon?: React.ReactNode;
  id?: string;
  onAddFolder?: () => void;
  onAddRequest?: () => void;
}

export function CollectionItem({
  name,
  type,
  method,
  isActive,
  onClick,
  children,
  hasChildren,
  icon,
  id,
  onAddFolder,
  onAddRequest,
}: CollectionItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const queryClient = useQueryClient();

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!id) return;
      const endpoint = type === "collection" ? "collections" : type === "folder" ? "folders" : "requests";
      const response = await fetch(`/api/${endpoint}/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error(`Failed to delete ${type}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces"] });
      setShowDeleteDialog(false);
    },
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const isContainer = type === "workspace" || type === "collection" || type === "folder";
  const canDelete = type !== "workspace" && id;
  const canAddFolder = type === "collection" && id;
  const canAddRequest = type === "folder" && id;

  return (
    <>
      <div
        className="w-full group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer hover-elevate active-elevate-2 ${
            isActive ? "bg-sidebar-accent" : ""
          }`}
          onClick={onClick}
          data-testid={`item-${type}-${name.toLowerCase().replace(/\s+/g, "-")}`}
        >
          {isContainer && hasChildren && (
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0"
              onClick={handleToggle}
              data-testid={`button-expand-${name.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
          )}
          {icon || (
            <>
              {type === "collection" || type === "folder" ? (
                <Folder className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              ) : type === "request" ? (
                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              ) : null}
            </>
          )}
          {type === "request" && method && (
            <HttpMethodBadge method={method} className="flex-shrink-0" />
          )}
          <span className="text-sm truncate flex-1">{name}</span>

          {isHovered && (canAddFolder || canAddRequest || canDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                  data-testid={`button-actions-${type}`}
                >
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canAddFolder && (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAddFolder?.(); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Folder
                  </DropdownMenuItem>
                )}
                {canAddRequest && (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAddRequest?.(); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Request
                  </DropdownMenuItem>
                )}
                {(canAddFolder || canAddRequest) && canDelete && <DropdownMenuSeparator />}
                {canDelete && (
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete {type}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        {isContainer && isExpanded && children && (
          <div className="ml-4 mt-1 space-y-1">{children}</div>
        )}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {type}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{name}"? This action cannot be undone.
              {type !== "request" && " All nested items will also be deleted."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
