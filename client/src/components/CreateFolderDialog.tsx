import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FolderPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreateFolderDialogProps {
  collectionId?: string;
  parentFolderId?: string;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CreateFolderDialog({ collectionId, parentFolderId, children, open: controlledOpen, onOpenChange }: CreateFolderDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [name, setName] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const createFolderMutation = useMutation({
    mutationFn: async (data: { name: string; collectionId?: string; parentId?: string }) => {
      const response = await apiRequest("POST", "/api/folders", data);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create folder");
      }
      return response.json();
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["/api/workspaces"] });
      toast({
        title: "Folder created",
        description: `"${name}" has been created successfully.`,
      });
      setOpen(false);
      setName("");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create folder",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      createFolderMutation.mutate({
        name,
        collectionId,
        parentId: parentFolderId,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <FolderPlus className="h-3 w-3" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Folder</DialogTitle>
            <DialogDescription>
              Create a new folder to organize your requests.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Folder"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || createFolderMutation.isPending}>
              {createFolderMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
