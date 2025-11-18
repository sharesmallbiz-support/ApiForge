import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RenameItemDialogProps {
  itemId: string;
  itemName: string;
  itemType: "collection" | "folder" | "request";
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RenameItemDialog({
  itemId,
  itemName,
  itemType,
  open,
  onOpenChange
}: RenameItemDialogProps) {
  const [name, setName] = useState(itemName);
  const queryClient = useQueryClient();

  // Update name when itemName prop changes
  useEffect(() => {
    setName(itemName);
  }, [itemName]);

  const renameMutation = useMutation({
    mutationFn: async (newName: string) => {
      const endpoint = itemType === "collection" ? "collections" :
                      itemType === "folder" ? "folders" : "requests";
      const response = await fetch(`/api/${endpoint}/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      if (!response.ok) throw new Error(`Failed to rename ${itemType}`);
      return response.json();
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["/api/workspaces"] });
      await queryClient.refetchQueries({ queryKey: ["/api/requests", itemId] });
      onOpenChange(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && name !== itemName) {
      renameMutation.mutate(name);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Rename {itemType}</DialogTitle>
            <DialogDescription>
              Enter a new name for this {itemType}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`${itemType} name`}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || name === itemName || renameMutation.isPending}>
              {renameMutation.isPending ? "Renaming..." : "Rename"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
