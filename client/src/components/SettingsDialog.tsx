import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useDebug } from "@/contexts/DebugContext";
import { localStorageService } from "@/lib/local-storage-service";
import {
  Download,
  Upload,
  Trash2,
  Info,
  AlertTriangle,
  Database,
  Bug,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { toast } = useToast();
  const { isEnabled: debugEnabled, toggleDebug } = useDebug();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleExport = () => {
    try {
      const exportData = localStorageService.exportAll();
      const blob = new Blob([exportData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `apiforge-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Export successful",
        description: "Your data has been exported to a JSON file",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        localStorageService.importAll(text);

        toast({
          title: "Import successful",
          description: "Your data has been imported. Refreshing page...",
        });

        // Refresh page to reload data
        setTimeout(() => window.location.reload(), 1000);
      } catch (error) {
        toast({
          title: "Import failed",
          description: error instanceof Error ? error.message : "Invalid file format",
          variant: "destructive",
        });
      }
    };
    input.click();
  };

  const handleClearAll = () => {
    try {
      localStorageService.clearAll();

      toast({
        title: "Data cleared",
        description: "All data has been cleared. Refreshing page...",
      });

      // Refresh page to show empty state
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      toast({
        title: "Clear failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setShowClearConfirm(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>
              Manage your ApiForge configuration and data
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Data Management Section */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Database className="h-4 w-4" />
                Data Management
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Export All Data</Label>
                    <p className="text-xs text-muted-foreground">
                      Download all collections, requests, and environments
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExport}
                    className="ml-2"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Import Data</Label>
                    <p className="text-xs text-muted-foreground">
                      Restore from a backup file
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleImport}
                    className="ml-2"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </Button>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium text-destructive">
                      Clear All Data
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Delete all collections and environments
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowClearConfirm(true)}
                    className="ml-2"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            {/* Developer Tools Section */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Bug className="h-4 w-4" />
                Developer Tools
              </h3>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="debug-mode" className="text-sm font-medium">
                    Debug Panel
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Show request/response tracking panel
                  </p>
                </div>
                <Switch
                  id="debug-mode"
                  checked={debugEnabled}
                  onCheckedChange={toggleDebug}
                />
              </div>
            </div>

            <Separator />

            {/* About Section */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Info className="h-4 w-4" />
                About
              </h3>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Version:</span>
                  <span className="font-mono">1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span>Storage:</span>
                  <span className="font-mono">localStorage (browser)</span>
                </div>
                <div className="flex justify-between">
                  <span>License:</span>
                  <span>MIT</span>
                </div>
              </div>
            </div>

            {/* Storage Info */}
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex gap-2">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">Local-First Storage</p>
                  <p>
                    All data is stored in your browser. Export regularly to back up
                    your collections and requests.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Clear All Confirmation Dialog */}
      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Clear All Data?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all your collections, requests,
              environments, and workflows. This action cannot be undone.
              <br />
              <br />
              <strong>Make sure to export your data first if you want to keep it!</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Clear All Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
