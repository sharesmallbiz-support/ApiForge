import { RequestBuilder } from "../RequestBuilder";

export default function RequestBuilderExample() {
  return (
    <div className="h-screen bg-background">
      <RequestBuilder onSend={() => console.log("Request sent")} />
    </div>
  );
}
