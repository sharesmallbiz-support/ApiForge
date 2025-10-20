import { Globe, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface EnvironmentItemProps {
  id: string;
  name: string;
  isActive?: boolean;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function EnvironmentItem({
  id,
  name,
  isActive,
  onClick,
  onEdit,
  onDelete,
}: EnvironmentItemProps) {
  return (
    <div
      className={`flex items-center justify-between p-2 rounded-md cursor-pointer hover-elevate group ${
        isActive ? "bg-accent" : ""
      }`}
      onClick={onClick}
      data-testid={`item-environment-${id}`}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <span className="text-sm truncate">{name}</span>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100"
            data-testid={`button-environment-menu-${id}`}
          >
            <MoreVertical className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit} data-testid={`menu-edit-${id}`}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={onDelete}
            className="text-destructive"
            data-testid={`menu-delete-${id}`}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
