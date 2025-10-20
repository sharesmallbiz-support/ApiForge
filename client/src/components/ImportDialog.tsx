import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUp, Link2 } from "lucide-react";

interface ImportDialogProps {
  children?: React.ReactNode;
}

export function ImportDialog({ children }: ImportDialogProps) {
  const [url, setUrl] = useState("");
  const [open, setOpen] = useState(false);

  const handleImport = () => {
    console.log("Importing from:", url);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button data-testid="button-import">
            <FileUp className="h-4 w-4 mr-2" />
            Import OpenAPI
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import OpenAPI Specification</DialogTitle>
          <DialogDescription>
            Import from a URL or upload a JSON file to create a new collection.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="url" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="url" data-testid="tab-import-url">
              <Link2 className="h-4 w-4 mr-2" />
              URL
            </TabsTrigger>
            <TabsTrigger value="file" data-testid="tab-import-file">
              <FileUp className="h-4 w-4 mr-2" />
              File
            </TabsTrigger>
          </TabsList>
          <TabsContent value="url" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">OpenAPI URL</Label>
              <Input
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://api.example.com/openapi.json"
                className="font-mono text-sm"
                data-testid="input-openapi-url"
              />
            </div>
            <Button onClick={handleImport} className="w-full" data-testid="button-import-submit">
              Import from URL
            </Button>
          </TabsContent>
          <TabsContent value="file" className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center hover-elevate cursor-pointer">
              <FileUp className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                JSON files only
              </p>
              <input
                type="file"
                accept=".json"
                className="hidden"
                data-testid="input-file-upload"
              />
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
