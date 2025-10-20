import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Plus } from "lucide-react";

interface KeyValue {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

interface KeyValueTableProps {
  title?: string;
  onAdd?: () => void;
}

export function KeyValueTable({ title, onAdd }: KeyValueTableProps) {
  const [items, setItems] = useState<KeyValue[]>([
    { id: "1", key: "", value: "", enabled: true },
  ]);

  const addRow = () => {
    setItems([...items, { id: Date.now().toString(), key: "", value: "", enabled: true }]);
    onAdd?.();
  };

  const removeRow = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, field: keyof KeyValue, value: string | boolean) => {
    setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  return (
    <div className="space-y-3">
      {title && <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>}
      <div className="space-y-2">
        <div className="grid grid-cols-[auto,1fr,1fr,auto] gap-2 text-xs font-medium text-muted-foreground px-2">
          <div className="w-8"></div>
          <div>KEY</div>
          <div>VALUE</div>
          <div className="w-8"></div>
        </div>
        {items.map((item) => (
          <div key={item.id} className="grid grid-cols-[auto,1fr,1fr,auto] gap-2 items-center">
            <Checkbox
              checked={item.enabled}
              onCheckedChange={(checked) =>
                updateItem(item.id, "enabled", checked as boolean)
              }
              data-testid={`checkbox-enable-${item.id}`}
            />
            <Input
              value={item.key}
              onChange={(e) => updateItem(item.id, "key", e.target.value)}
              placeholder="Key"
              className="font-mono text-sm"
              data-testid={`input-key-${item.id}`}
            />
            <Input
              value={item.value}
              onChange={(e) => updateItem(item.id, "value", e.target.value)}
              placeholder="Value"
              className="font-mono text-sm"
              data-testid={`input-value-${item.id}`}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeRow(item.id)}
              data-testid={`button-delete-${item.id}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button
          variant="ghost"
          size="sm"
          onClick={addRow}
          className="w-full"
          data-testid="button-add-row"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Row
        </Button>
      </div>
    </div>
  );
}
