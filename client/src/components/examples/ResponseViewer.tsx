import { ResponseViewer } from "../ResponseViewer";

export default function ResponseViewerExample() {
  return (
    <div className="h-screen bg-background">
      <ResponseViewer
        statusCode={200}
        responseTime={245}
        size={1240}
      />
    </div>
  );
}
