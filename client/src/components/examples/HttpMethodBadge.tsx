import { HttpMethodBadge } from "../HttpMethodBadge";

export default function HttpMethodBadgeExample() {
  return (
    <div className="flex gap-2 p-4 bg-background">
      <HttpMethodBadge method="GET" />
      <HttpMethodBadge method="POST" />
      <HttpMethodBadge method="PUT" />
      <HttpMethodBadge method="DELETE" />
      <HttpMethodBadge method="PATCH" />
    </div>
  );
}
