import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Move, Folder as FolderIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Workspace } from "@shared/schema";

interface MoveItemDialogProps {
  itemId: string;
  itemType: "folder" | "request";
  currentParentId: string; // folderId for requests, collectionId for folders
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MoveItemDialog({
  itemId,
  itemType,
  currentParentId,
  open,
  onOpenChange,
}: MoveItemDialogProps) {
  const [selectedParentId, setSelectedParentId] = useState(currentParentId);
  const queryClient = useQueryClient();

  const { data: workspacesData } = useQuery<{ workspaces: Workspace[] }>({
    queryKey: ["/api/workspaces"],
  });

  // Reset selected parent when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedParentId(currentParentId);
    }
  }, [open, currentParentId]);

  const moveMutation = useMutation({
    mutationFn: async (newParentId: string) => {
      const endpoint = itemType === "folder" ? "folders" : "requests";
      const parentField = itemType === "folder" ? "collectionId" : "folderId";
      const response = await fetch(`/api/${endpoint}/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [parentField]: newParentId }),
      });
      if (!response.ok) throw new Error(`Failed to move ${itemType}`);
      return response.json();
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["/api/workspaces"] });
      onOpenChange(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedParentId && selectedParentId !== currentParentId) {
      moveMutation.mutate(selectedParentId);
    }
  };

  // Get available destinations based on item type
  const destinations = workspacesData?.workspaces.flatMap(workspace =>
    workspace.collections.flatMap(collection => {
      if (itemType === "folder") {
        // For folders, show collections
        return [{
          id: collection.id,
          name: `${collection.name}`,
          type: "collection" as const,
        }];
      } else {
        // For requests, show folders
        return collection.folders.map(folder => ({
          id: folder.id,
          name: `${collection.name} / ${folder.name}`,
          type: "folder" as const,
        }));
      }
    })
  ) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Move {itemType}</DialogTitle>
            <DialogDescription>
              Select a new {itemType === "folder" ? "collection" : "folder"} for this {itemType}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="destination">Destination</Label>
              <Select value={selectedParentId} onValueChange={setSelectedParentId}>
                <SelectTrigger id="destination">
                  <SelectValue placeholder={`Select ${itemType === "folder" ? "collection" : "folder"}`} />
                </SelectTrigger>
                <SelectContent>
                  {destinations.map((dest) => (
                    <SelectItem key={dest.id} value={dest.id}>
                      <div className="flex items-center gap-2">
                        <FolderIcon className="h-4 w-4" />
                        {dest.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!selectedParentId || selectedParentId === currentParentId || moveMutation.isPending}
            >
              {moveMutation.isPending ? "Moving..." : "Move"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
