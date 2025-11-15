import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, ArrowRight, ArrowLeft, BookOpen } from "lucide-react";

interface GettingStartedProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenUserGuide: () => void;
  onCreateSample: () => void;
}

const steps = [
  {
    title: "Welcome to ApiForge! 🚀",
    description: "Your professional REST API testing tool",
    content: (
      <div className="space-y-4 text-sm">
        <p>
          ApiForge helps you test and debug REST APIs with ease. Think of it as Postman,
          but built for speed and simplicity.
        </p>
        <div className="border rounded-lg p-4 space-y-2">
          <h4 className="font-semibold">What you can do:</h4>
          <ul className="space-y-1 ml-4">
            <li>✅ Send HTTP requests (GET, POST, PUT, DELETE, etc.)</li>
            <li>✅ Organize requests in collections and folders</li>
            <li>✅ Use environment variables for different servers</li>
            <li>✅ Write post-response scripts to chain requests</li>
            <li>✅ Import APIs from OpenAPI specs or CURL commands</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    title: "Understanding the Layout 📐",
    description: "Three main areas to know",
    content: (
      <div className="space-y-3 text-sm">
        <div className="border-l-4 border-blue-500 pl-4 py-2">
          <h4 className="font-semibold mb-1">1. Sidebar (Left)</h4>
          <p className="text-muted-foreground">
            Browse your collections, folders, and requests. Switch between Collections
            and Environments tabs.
          </p>
        </div>
        <div className="border-l-4 border-green-500 pl-4 py-2">
          <h4 className="font-semibold mb-1">2. Request Builder (Center)</h4>
          <p className="text-muted-foreground">
            Configure your HTTP request: set URL, method, headers, params, and body.
            Click "Send" to execute.
          </p>
        </div>
        <div className="border-l-4 border-purple-500 pl-4 py-2">
          <h4 className="font-semibold mb-1">3. Response Viewer (Right)</h4>
          <p className="text-muted-foreground">
            See the API response, including status code, headers, body, and execution history.
          </p>
        </div>
      </div>
    ),
  },
  {
    title: "Core Concepts 💡",
    description: "Collections, Requests, and Environments",
    content: (
      <div className="space-y-3 text-sm">
        <div className="bg-card border rounded-lg p-3">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            📁 Collections
          </h4>
          <p className="text-muted-foreground">
            Collections group related API requests together. For example, create a
            "User API" collection for all user-related endpoints.
          </p>
        </div>
        <div className="bg-card border rounded-lg p-3">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            📄 Requests
          </h4>
          <p className="text-muted-foreground">
            Each request represents an API endpoint. Configure the HTTP method (GET, POST, etc.),
            URL, headers, and body. Save and reuse them anytime.
          </p>
        </div>
        <div className="bg-card border rounded-lg p-3">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            🌍 Environments
          </h4>
          <p className="text-muted-foreground">
            Environments store variables like server URLs and API tokens. Switch between
            Dev, Test, and Production without changing your requests.
          </p>
        </div>
      </div>
    ),
  },
  {
    title: "Using Variables 🔧",
    description: "Make your requests flexible",
    content: (
      <div className="space-y-3 text-sm">
        <p>
          Variables let you reuse values across requests. Use{" "}
          <code className="bg-muted px-1 rounded">{"{{variableName}}"}</code> syntax:
        </p>
        <div className="space-y-2">
          <div className="bg-muted p-3 rounded">
            <div className="font-semibold mb-1">Example URL:</div>
            <code className="text-xs">{"{{baseUrl}}"}/api/users/{"{{userId}}"}</code>
          </div>
          <div className="bg-muted p-3 rounded">
            <div className="font-semibold mb-1">Example Header:</div>
            <code className="text-xs">Authorization: Bearer {"{{token}}"}</code>
          </div>
        </div>
        <div className="border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950 p-3 rounded">
          <p className="font-semibold mb-1">💡 Pro Tip</p>
          <p className="text-muted-foreground">
            Create environment variables in the Environments tab, then select an environment
            from the dropdown when sending requests.
          </p>
        </div>
      </div>
    ),
  },
  {
    title: "Ready to Start! 🎉",
    description: "Choose how you want to begin",
    content: (
      <div className="space-y-4">
        <p className="text-sm">
          You're all set! Here are two ways to get started:
        </p>
        <div className="grid gap-3">
          <div className="border rounded-lg p-4 space-y-2 hover:border-primary cursor-pointer transition-colors">
            <h4 className="font-semibold flex items-center gap-2">
              🎯 Load Sample Collection
            </h4>
            <p className="text-sm text-muted-foreground">
              We'll create a sample collection with working API examples. Perfect for
              learning how everything works!
            </p>
          </div>
          <div className="border rounded-lg p-4 space-y-2 hover:border-primary cursor-pointer transition-colors">
            <h4 className="font-semibold flex items-center gap-2">
              ✨ Start from Scratch
            </h4>
            <p className="text-sm text-muted-foreground">
              Create your first collection manually. Great if you want to jump right
              into testing your own API.
            </p>
          </div>
        </div>
      </div>
    ),
  },
];

export function GettingStarted({
  open,
  onOpenChange,
  onOpenUserGuide,
  onCreateSample,
}: GettingStartedProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = () => {
    onOpenChange(false);
    setCurrentStep(0);
  };

  const handleStartWithSample = () => {
    onCreateSample();
    onOpenChange(false);
    setCurrentStep(0);
  };

  const isLastStep = currentStep === steps.length - 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{steps[currentStep].title}</DialogTitle>
          <DialogDescription>{steps[currentStep].description}</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Progress indicators */}
          <div className="flex gap-2 mb-6">
            {steps.map((_, index) => (
              <div key={index} className="flex-1">
                {index <= currentStep ? (
                  <div className="h-1 bg-primary rounded-full" />
                ) : (
                  <div className="h-1 bg-muted rounded-full" />
                )}
              </div>
            ))}
          </div>

          {/* Step content */}
          <div className="min-h-[300px]">{steps[currentStep].content}</div>
        </div>

        <DialogFooter className="flex justify-between items-center sm:justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenUserGuide}
            className="gap-2"
          >
            <BookOpen className="h-4 w-4" />
            Open Full Guide
          </Button>

          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button variant="outline" onClick={handlePrevious} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Previous
              </Button>
            )}

            {isLastStep ? (
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleFinish}>
                  Start from Scratch
                </Button>
                <Button onClick={handleStartWithSample} className="gap-2">
                  Load Sample Collection
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button onClick={handleNext} className="gap-2">
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
