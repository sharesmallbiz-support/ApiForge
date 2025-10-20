import { StatusCodeBadge } from "../StatusCodeBadge";

export default function StatusCodeBadgeExample() {
  return (
    <div className="flex gap-2 p-4 bg-background">
      <StatusCodeBadge code={200} />
      <StatusCodeBadge code={304} />
      <StatusCodeBadge code={404} />
      <StatusCodeBadge code={500} />
    </div>
  );
}
