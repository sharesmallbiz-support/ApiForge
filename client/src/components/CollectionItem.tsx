import { ChevronDown, ChevronRight, Folder, FileText } from "lucide-react";
import { HttpMethodBadge } from "./HttpMethodBadge";
import { Button } from "@/components/ui/button";
import { useState } from "react";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

interface Request {
  id: string;
  name: string;
  method: HttpMethod;
  url: string;
}

interface CollectionItemProps {
  name: string;
  type: "workspace" | "folder" | "request";
  method?: HttpMethod;
  isActive?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
  hasChildren?: boolean;
  icon?: React.ReactNode;
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
}: CollectionItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const isContainer = type === "workspace" || type === "folder";

  return (
    <div className="w-full">
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
            {type === "folder" ? (
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
      </div>
      {isContainer && isExpanded && children && (
        <div className="ml-4 mt-1 space-y-1">{children}</div>
      )}
    </div>
  );
}
