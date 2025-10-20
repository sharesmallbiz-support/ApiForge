import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe } from "lucide-react";
import type { Environment } from "@shared/schema";

interface EnvironmentSelectorProps {
  value?: string;
  onChange?: (value: string) => void;
}

export function EnvironmentSelector({ value, onChange }: EnvironmentSelectorProps) {
  const { data } = useQuery<{ environments: Environment[] }>({
    queryKey: ["/api/environments"],
  });

  const environments = data?.environments || [];
  const selectedEnv = value || (environments[0]?.id || "");

  return (
    <Select value={selectedEnv} onValueChange={onChange}>
      <SelectTrigger className="w-48" data-testid="select-environment">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          <SelectValue placeholder="Select environment" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {environments.map((env) => (
          <SelectItem key={env.id} value={env.id}>
            {env.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
