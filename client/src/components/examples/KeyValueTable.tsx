import { KeyValueTable } from "../KeyValueTable";

export default function KeyValueTableExample() {
  return (
    <div className="p-4 bg-background max-w-2xl">
      <KeyValueTable title="Headers" onAdd={() => console.log("Row added")} />
    </div>
  );
}
