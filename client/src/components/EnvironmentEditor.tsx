import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Environment, Workspace, Collection, EnvironmentVariableScope } from "@shared/schema";

interface EnvironmentEditorProps {
  environmentId: string;
}

interface Variable {
  key: string;
  value: string;
  enabled: boolean;
  scope?: EnvironmentVariableScope;
  workspaceId?: string;
  collectionId?: string;
}

export function EnvironmentEditor({ environmentId }: EnvironmentEditorProps) {
  const { toast } = useToast();
  const { data } = useQuery<{ environment: Environment }>({
    queryKey: ["/api/environments", environmentId],
    enabled: !!environmentId,
  });

  const { data: workspacesData } = useQuery<{ workspaces: Workspace[] }>({
    queryKey: ["/api/workspaces"],
  });

  const { data: collectionsData } = useQuery<{ collections: Collection[] }>({
    queryKey: ["/api/collections"],
  });

  const environment = data?.environment;
  const workspaces = workspacesData?.workspaces || [];
  const collections = collectionsData?.collections || [];

  const [variables, setVariables] = useState<Variable[]>([]);

  useEffect(() => {
    if (environment?.variables) {
      setVariables(environment.variables);
    }
  }, [environment]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PUT", `/api/environments/${environmentId}`, {
        variables,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/environments", environmentId] });
      queryClient.invalidateQueries({ queryKey: ["/api/environments"] });
      toast({
        title: "Environment saved",
        description: "Your changes have been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error saving environment",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    },
  });

  const addVariable = () => {
    setVariables([...variables, { key: "", value: "", enabled: true, scope: "global" }]);
  };

  const removeVariable = (index: number) => {
    setVariables(variables.filter((_, i) => i !== index));
  };

  const updateVariable = (index: number, field: keyof Variable, value: string | boolean | EnvironmentVariableScope) => {
    const updated = [...variables];
    updated[index] = { ...updated[index], [field]: value };
    
    // Clear workspace/collection IDs when scope changes
    if (field === "scope") {
      if (value === "global") {
        delete updated[index].workspaceId;
        delete updated[index].collectionId;
      } else if (value === "workspace") {
        delete updated[index].collectionId;
      }
    }
    
    setVariables(updated);
  };

  const handleSave = () => {
    updateMutation.mutate();
  };

  const handleCancel = () => {
    if (environment?.variables) {
      setVariables(environment.variables);
    }
  };

  if (!environment) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>Loading environment...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <div className="space-y-4">
          <div>
            <Label htmlFor="env-name">Environment Name</Label>
            <Input
              id="env-name"
              value={environment.name}
              className="mt-2 max-w-md"
              data-testid="input-environment-name"
              readOnly
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Variables</h3>
            <Button 
              onClick={addVariable} 
              size="sm"
              data-testid="button-add-variable"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Variable
            </Button>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-[auto_1fr_1fr_200px_auto] gap-2 items-center pb-2 border-b text-sm font-medium text-muted-foreground">
              <div className="w-10"></div>
              <div>KEY</div>
              <div>VALUE</div>
              <div>SCOPE</div>
              <div className="w-10"></div>
            </div>

            {variables.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No variables defined</p>
                <p className="text-sm mt-1">Add a variable to get started</p>
              </div>
            ) : (
              variables.map((variable, index) => (
                <div key={index} className="space-y-2">
                  <div
                    className="grid grid-cols-[auto_1fr_1fr_200px_auto] gap-2 items-center"
                    data-testid={`variable-row-${index}`}
                  >
                    <Checkbox
                      checked={variable.enabled}
                      onCheckedChange={(checked) =>
                        updateVariable(index, "enabled", checked === true)
                      }
                      data-testid={`checkbox-variable-${index}`}
                    />
                    <Input
                      value={variable.key}
                      onChange={(e) => updateVariable(index, "key", e.target.value)}
                      placeholder="Key"
                      className="font-mono text-sm"
                      data-testid={`input-variable-key-${index}`}
                    />
                    <Input
                      value={variable.value}
                      onChange={(e) => updateVariable(index, "value", e.target.value)}
                      placeholder="Value"
                      className="font-mono text-sm"
                      data-testid={`input-variable-value-${index}`}
                    />
                    <Select
                      value={variable.scope || "global"}
                      onValueChange={(value) => updateVariable(index, "scope", value as EnvironmentVariableScope)}
                    >
                      <SelectTrigger data-testid={`select-variable-scope-${index}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="global">Global</SelectItem>
                        <SelectItem value="workspace">Workspace</SelectItem>
                        <SelectItem value="collection">Collection</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeVariable(index)}
                      data-testid={`button-delete-variable-${index}`}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                  {variable.scope === "workspace" && (
                    <div className="ml-12 grid grid-cols-[1fr_1fr_200px] gap-2">
                      <div></div>
                      <Select
                        value={variable.workspaceId || ""}
                        onValueChange={(value) => updateVariable(index, "workspaceId", value)}
                      >
                        <SelectTrigger data-testid={`select-workspace-${index}`}>
                          <SelectValue placeholder="Select workspace" />
                        </SelectTrigger>
                        <SelectContent>
                          {workspaces.map((ws) => (
                            <SelectItem key={ws.id} value={ws.id}>
                              {ws.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div></div>
                    </div>
                  )}
                  {variable.scope === "collection" && (
                    <div className="ml-12 grid grid-cols-[1fr_1fr_200px] gap-2">
                      <div></div>
                      <Select
                        value={variable.collectionId || ""}
                        onValueChange={(value) => updateVariable(index, "collectionId", value)}
                      >
                        <SelectTrigger data-testid={`select-collection-${index}`}>
                          <SelectValue placeholder="Select collection" />
                        </SelectTrigger>
                        <SelectContent>
                          {collections.map((col) => (
                            <SelectItem key={col.id} value={col.id}>
                              {col.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div></div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="p-6 border-t">
        <div className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={handleCancel}
            disabled={updateMutation.isPending}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={updateMutation.isPending}
            data-testid="button-save"
          >
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
