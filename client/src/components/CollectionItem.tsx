import { ChevronDown, ChevronRight, Folder, FileText, Plus, Trash2, MoreVertical, Edit, Move } from "lucide-react";
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
import { RenameItemDialog } from "./RenameItemDialog";
import { MoveItemDialog } from "./MoveItemDialog";
import { apiRequest } from "@/lib/queryClient";

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
  parentId?: string; // collectionId for folders, folderId for requests
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
  parentId,
  onAddFolder,
  onAddRequest,
}: CollectionItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const queryClient = useQueryClient();

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!id) return;
      const endpoint = type === "collection" ? "collections" : type === "folder" ? "folders" : "requests";
      const response = await apiRequest("DELETE", `/api/${endpoint}/${id}`);
      if (!response.ok) throw new Error(`Failed to delete ${type}`);
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["/api/workspaces"] });
      setShowDeleteDialog(false);
    },
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    if (id && type !== "workspace" && type !== "collection") {
      e.dataTransfer.setData("itemId", id);
      e.dataTransfer.setData("itemType", type);
      e.dataTransfer.setData("parentId", parentId || "");
      e.dataTransfer.effectAllowed = "move";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const draggedType = e.dataTransfer.types.includes("itemtype") ?
      e.dataTransfer.getData("itemType") : null;

    // Allow dropping requests on folders, folders on collections, and folders on other folders
    if ((type === "folder" && (draggedType === "request" || draggedType === "folder")) ||
        (type === "collection" && draggedType === "folder")) {
      e.dataTransfer.dropEffect = "move";
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const draggedId = e.dataTransfer.getData("itemId");
    const draggedType = e.dataTransfer.getData("itemType");
    const draggedParentId = e.dataTransfer.getData("parentId");

    if (!draggedId || !id || draggedId === id) return;

    // Move request to folder
    if (type === "folder" && draggedType === "request" && draggedParentId !== id) {
      moveMutation.mutate({
        itemId: draggedId,
        itemType: "request",
        newParentId: id,
      });
    }
    // Move folder to collection
    else if (type === "collection" && draggedType === "folder" && draggedParentId !== id) {
      moveMutation.mutate({
        itemId: draggedId,
        itemType: "folder",
        newParentId: id,
      });
    }
    // Move folder to another folder
    else if (type === "folder" && draggedType === "folder" && draggedParentId !== id && draggedId !== id) {
      moveMutation.mutate({
        itemId: draggedId,
        itemType: "folder",
        newParentId: id,
      });
    }
  };

  const moveMutation = useMutation({
    mutationFn: async ({ itemId, itemType, newParentId }: {
      itemId: string;
      itemType: string;
      newParentId: string;
    }) => {
      const endpoint = itemType === "folder" ? "folders" : "requests";
      let updateData: any = {};

      if (itemType === "folder") {
        // Determine if newParentId is a collection or folder
        // If type is "collection", update collectionId and clear parentId
        // If type is "folder", update parentId and clear collectionId
        if (type === "collection") {
          updateData = { collectionId: newParentId, parentId: null };
        } else if (type === "folder") {
          updateData = { parentId: newParentId, collectionId: null };
        }
      } else {
        // For requests, always use folderId
        updateData = { folderId: newParentId };
      }

      const response = await apiRequest("PATCH", `/api/${endpoint}/${itemId}`, updateData);
      if (!response.ok) throw new Error(`Failed to move ${itemType}`);
      return response.json();
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["/api/workspaces"] });
    },
  });

  const isContainer = type === "workspace" || type === "collection" || type === "folder";
  const canDelete = type !== "workspace" && id;
  const canAddFolder = (type === "collection" || type === "folder") && id;
  const canAddRequest = type === "folder" && id;
  const canMove = (type === "folder" || type === "request") && id && parentId;
  const isDraggable = canMove;

  return (
    <>
      <div
        className="w-full group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        draggable={isDraggable}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer hover-elevate active-elevate-2 ${
            isActive ? "bg-sidebar-accent" : ""
          } ${isDragOver ? "bg-primary/10 ring-2 ring-primary" : ""}`}
          onClick={onClick}
          data-testid={`item-${type}-${(name || '').toLowerCase().replace(/\s+/g, "-")}`}
        >
          {isContainer && hasChildren && (
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0"
              onClick={handleToggle}
              data-testid={`button-expand-${(name || '').toLowerCase().replace(/\s+/g, "-")}`}
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
          <span className="text-sm truncate flex-1">{name || 'Unnamed'}</span>

          {(canAddFolder || canAddRequest || canDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
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
                {(canAddFolder || canAddRequest) && <DropdownMenuSeparator />}
                {type !== "workspace" && id && (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setShowRenameDialog(true); }}>
                    <Edit className="h-4 w-4 mr-2" />
                    Rename
                  </DropdownMenuItem>
                )}
                {canMove && (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setShowMoveDialog(true); }}>
                    <Move className="h-4 w-4 mr-2" />
                    Move
                  </DropdownMenuItem>
                )}
                {(type !== "workspace" && id || canMove) && canDelete && <DropdownMenuSeparator />}
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

      {id && type !== "workspace" && (
        <RenameItemDialog
          itemId={id}
          itemName={name}
          itemType={type}
          open={showRenameDialog}
          onOpenChange={setShowRenameDialog}
        />
      )}

      {canMove && parentId && (
        <MoveItemDialog
          itemId={id!}
          itemType={type as "folder" | "request"}
          currentParentId={parentId}
          open={showMoveDialog}
          onOpenChange={setShowMoveDialog}
        />
      )}
    </>
  );
}
