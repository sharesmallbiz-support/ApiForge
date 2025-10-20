import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe } from "lucide-react";

interface Environment {
  id: string;
  name: string;
  baseUrl: string;
}

const environments: Environment[] = [
  { id: "dev", name: "Development", baseUrl: "https://dev-api.example.com" },
  { id: "test", name: "Test", baseUrl: "https://test-api.example.com" },
  { id: "prod", name: "Production", baseUrl: "https://api.example.com" },
];

export function EnvironmentSelector() {
  const [selected, setSelected] = useState("dev");

  return (
    <Select value={selected} onValueChange={setSelected}>
      <SelectTrigger className="w-48" data-testid="select-environment">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          <SelectValue />
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
