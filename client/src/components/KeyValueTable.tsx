import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Plus } from "lucide-react";

interface KeyValue {
  key: string;
  value: string;
  enabled: boolean;
}

interface KeyValueTableProps {
  title?: string;
  items?: KeyValue[];
  onChange?: (items: KeyValue[]) => void;
  onAdd?: () => void;
}

export function KeyValueTable({ title, items: controlledItems, onChange, onAdd }: KeyValueTableProps) {
  const [internalItems, setInternalItems] = useState<KeyValue[]>([
    { key: "", value: "", enabled: true },
  ]);

  // Use controlled items if provided, otherwise use internal state
  const items = controlledItems || internalItems;
  const updateItems = onChange || setInternalItems;

  const addRow = () => {
    updateItems([...items, { key: "", value: "", enabled: true }]);
    onAdd?.();
  };

  const removeRow = (index: number) => {
    updateItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof KeyValue, value: string | boolean) => {
    updateItems(items.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
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
        {items.map((item, index) => (
          <div key={index} className="grid grid-cols-[auto,1fr,1fr,auto] gap-2 items-center">
            <Checkbox
              checked={item.enabled}
              onCheckedChange={(checked) =>
                updateItem(index, "enabled", checked as boolean)
              }
              data-testid={`checkbox-enable-${index}`}
            />
            <Input
              value={item.key}
              onChange={(e) => updateItem(index, "key", e.target.value)}
              placeholder="Key"
              className="font-mono text-sm"
              data-testid={`input-key-${index}`}
            />
            <Input
              value={item.value}
              onChange={(e) => updateItem(index, "value", e.target.value)}
              placeholder="Value"
              className="font-mono text-sm"
              data-testid={`input-value-${index}`}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeRow(index)}
              data-testid={`button-delete-${index}`}
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
