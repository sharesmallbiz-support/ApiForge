import { GripVertical, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HttpMethodBadge } from "./HttpMethodBadge";
import { Badge } from "@/components/ui/badge";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

interface WorkflowStepProps {
  stepNumber: number;
  name: string;
  method: HttpMethod;
  url: string;
  onDelete?: () => void;
  onAddStep?: () => void;
}

export function WorkflowStep({
  stepNumber,
  name,
  method,
  url,
  onDelete,
  onAddStep,
}: WorkflowStepProps) {
  return (
    <div className="space-y-2">
      <Card className="p-4 hover-elevate cursor-move">
        <div className="flex items-start gap-3">
          <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5 cursor-grab" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="font-mono text-xs">
                Step {stepNumber}
              </Badge>
              <span className="font-medium text-sm">{name}</span>
            </div>
            <div className="flex items-center gap-2">
              <HttpMethodBadge method={method} />
              <span className="text-xs font-mono text-muted-foreground truncate">
                {url}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            data-testid={`button-delete-step-${stepNumber}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </Card>
      <Button
        variant="ghost"
        size="sm"
        className="w-full"
        onClick={onAddStep}
        data-testid={`button-add-step-after-${stepNumber}`}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Step
      </Button>
    </div>
  );
}
