import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface UserGuideProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserGuide({ open, onOpenChange }: UserGuideProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>ApiForge User Guide</DialogTitle>
          <DialogDescription>
            Learn how to test APIs like a pro
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="quickstart" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="quickstart">Quick Start</TabsTrigger>
            <TabsTrigger value="requests">Requests</TabsTrigger>
            <TabsTrigger value="environments">Environments</TabsTrigger>
            <TabsTrigger value="scripting">Scripting</TabsTrigger>
            <TabsTrigger value="import">Import</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            {/* QUICK START TAB */}
            <TabsContent value="quickstart" className="space-y-6 pr-4">
              <section>
                <h3 className="text-lg font-semibold mb-3">🚀 Get Started in 3 Steps</h3>

                <div className="space-y-4">
                  <div className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="default">Step 1</Badge>
                      <h4 className="font-semibold">Create a Collection</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Collections organize your API requests. Click the <strong>+</strong> button
                      next to "Collections" in the sidebar to create your first collection.
                    </p>
                    <div className="bg-muted p-3 rounded font-mono text-sm">
                      Sidebar → Collections → + → Enter name → Create
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="default">Step 2</Badge>
                      <h4 className="font-semibold">Add Your First Request</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Right-click on your collection → <strong>Add Request</strong> →
                      Enter a name and URL → Create
                    </p>
                    <div className="bg-muted p-3 rounded font-mono text-sm">
                      Example: GET https://jsonplaceholder.typicode.com/users/1
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="default">Step 3</Badge>
                      <h4 className="font-semibold">Send the Request</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Click the request in the sidebar → Configure if needed →
                      Click <strong>Send</strong> → View the response!
                    </p>
                    <div className="bg-muted p-3 rounded font-mono text-sm">
                      Request Builder → Send button → See response in right panel
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">💡 Pro Tips</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex gap-2">
                    <span>•</span>
                    <span>Use <strong>folders</strong> to organize requests within collections</span>
                  </li>
                  <li className="flex gap-2">
                    <span>•</span>
                    <span>Create <strong>environments</strong> for Dev, Test, and Production URLs</span>
                  </li>
                  <li className="flex gap-2">
                    <span>•</span>
                    <span>Use <code className="bg-muted px-1 rounded">{"{{variables}}"}</code> in URLs and headers</span>
                  </li>
                  <li className="flex gap-2">
                    <span>•</span>
                    <span>Click <strong>Save</strong> after editing a request to persist changes</span>
                  </li>
                  <li className="flex gap-2">
                    <span>•</span>
                    <span>View request history in the Response panel's History tab</span>
                  </li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">🔒 Your Data & Privacy</h3>
                <div className="border-l-4 border-primary bg-primary/10 rounded-r-lg p-4 space-y-3 text-sm">
                  <div>
                    <h4 className="font-semibold mb-1">All Data Stored Locally</h4>
                    <p className="text-muted-foreground">
                      ApiForge stores all your collections, requests, and environments in your
                      browser's localStorage. Nothing is sent to external servers except when
                      you click "Send" to test an API.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Benefits</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>✅ Complete privacy - your API configs stay on your device</li>
                      <li>✅ Works offline - create requests without internet</li>
                      <li>✅ Instant saves - no network delays</li>
                      <li>✅ No account required - start using immediately</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Backup Your Data</h4>
                    <p className="text-muted-foreground">
                      Export all your data as JSON from Settings. Import on any browser to
                      restore. Regular exports are recommended before clearing browser data!
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">🎯 Try the Sample Collection</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  We've included sample requests to help you get started. Look for the
                  "Sample API Collection" in your sidebar with ready-to-use examples!
                </p>
              </section>
            </TabsContent>

            {/* REQUESTS TAB */}
            <TabsContent value="requests" className="space-y-6 pr-4">
              <section>
                <h3 className="text-lg font-semibold mb-3">Making HTTP Requests</h3>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">HTTP Methods</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="border rounded p-2">
                        <strong>GET</strong> - Retrieve data
                      </div>
                      <div className="border rounded p-2">
                        <strong>POST</strong> - Create new data
                      </div>
                      <div className="border rounded p-2">
                        <strong>PUT</strong> - Update existing data
                      </div>
                      <div className="border rounded p-2">
                        <strong>PATCH</strong> - Partial update
                      </div>
                      <div className="border rounded p-2">
                        <strong>DELETE</strong> - Remove data
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Query Parameters</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Add query parameters in the Params tab. They'll be appended to your URL automatically.
                    </p>
                    <div className="bg-muted p-3 rounded font-mono text-xs">
                      url?key1=value1&key2=value2
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Headers</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Add custom headers in the Headers tab. Common examples:
                    </p>
                    <div className="space-y-1 text-sm font-mono">
                      <div className="bg-muted p-2 rounded">Content-Type: application/json</div>
                      <div className="bg-muted p-2 rounded">Authorization: Bearer {"{{token}}"}</div>
                      <div className="bg-muted p-2 rounded">Accept: application/json</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Request Body</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      For POST/PUT/PATCH requests, add a JSON body in the Body tab:
                    </p>
                    <div className="bg-muted p-3 rounded font-mono text-xs">
                      {`{
  "name": "John Doe",
  "email": "john@example.com"
}`}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Authentication</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Use the Auth tab to add authentication:
                    </p>
                    <ul className="space-y-1 text-sm">
                      <li>• <strong>Bearer Token:</strong> For JWT/OAuth tokens</li>
                      <li>• <strong>Basic Auth:</strong> Username and password</li>
                      <li>• <strong>API Key:</strong> Custom API keys</li>
                    </ul>
                  </div>
                </div>
              </section>
            </TabsContent>

            {/* ENVIRONMENTS TAB */}
            <TabsContent value="environments" className="space-y-6 pr-4">
              <section>
                <h3 className="text-lg font-semibold mb-3">Environment Variables</h3>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">What are Environments?</h4>
                    <p className="text-sm text-muted-foreground">
                      Environments let you switch between different API configurations
                      (Dev, Test, Production) without changing your requests.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Creating an Environment</h4>
                    <div className="bg-muted p-3 rounded font-mono text-sm space-y-1">
                      <div>1. Click + next to "Environments" in sidebar</div>
                      <div>2. Enter name (e.g., "Development")</div>
                      <div>3. Add variables with key-value pairs</div>
                      <div>4. Click "Create"</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Variable Scopes</h4>
                    <div className="space-y-2 text-sm">
                      <div className="border rounded p-3">
                        <strong className="text-blue-600">Global</strong>
                        <p className="text-muted-foreground">Available everywhere (e.g., apiKey, timeout)</p>
                      </div>
                      <div className="border rounded p-3">
                        <strong className="text-green-600">Workspace</strong>
                        <p className="text-muted-foreground">Available across all collections in workspace (e.g., token)</p>
                      </div>
                      <div className="border rounded p-3">
                        <strong className="text-purple-600">Collection</strong>
                        <p className="text-muted-foreground">Specific to one collection (e.g., baseUrl)</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Using Variables</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Reference variables using double curly braces:
                    </p>
                    <div className="space-y-2 font-mono text-sm">
                      <div className="bg-muted p-2 rounded">URL: {"{{baseUrl}}"}/api/users</div>
                      <div className="bg-muted p-2 rounded">Header: Bearer {"{{token}}"}</div>
                      <div className="bg-muted p-2 rounded">Body: {"{{userId}}"}</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Environment Headers</h4>
                    <p className="text-sm text-muted-foreground">
                      Add headers that apply to all requests when this environment is active.
                      Perfect for authentication headers!
                    </p>
                  </div>
                </div>
              </section>
            </TabsContent>

            {/* SCRIPTING TAB */}
            <TabsContent value="scripting" className="space-y-6 pr-4">
              <section>
                <h3 className="text-lg font-semibold mb-3">Post-Response Scripts</h3>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">What are Scripts?</h4>
                    <p className="text-sm text-muted-foreground">
                      Scripts run after receiving a response. Use them to extract data,
                      set variables, or validate responses.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Script API (Postman-compatible)</h4>
                    <div className="space-y-2 text-sm font-mono">
                      <div className="bg-muted p-2 rounded">pm.response.json() - Parse JSON response</div>
                      <div className="bg-muted p-2 rounded">pm.environment.set(key, val) - Set variable</div>
                      <div className="bg-muted p-2 rounded">pm.environment.get(key) - Get variable</div>
                      <div className="bg-muted p-2 rounded">console.log() - Debug output</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Example: Extract Token</h4>
                    <div className="bg-muted p-3 rounded font-mono text-xs">
{`// Extract auth token from login response
const response = pm.response.json();
if (response.token) {
  pm.environment.set("token", response.token);
  console.log("Token saved:", response.token);
}`}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Example: Save ID for Next Request</h4>
                    <div className="bg-muted p-3 rounded font-mono text-xs">
{`// Extract created user ID
const response = pm.response.json();
if (response.id) {
  pm.environment.set("userId", response.id);
  console.log("User ID saved:", response.id);
}`}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Common Use Cases</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Extract authentication tokens</li>
                      <li>• Save IDs for dependent requests</li>
                      <li>• Chain API calls together</li>
                      <li>• Validate response data</li>
                      <li>• Debug API responses</li>
                    </ul>
                  </div>
                </div>
              </section>
            </TabsContent>

            {/* IMPORT TAB */}
            <TabsContent value="import" className="space-y-6 pr-4">
              <section>
                <h3 className="text-lg font-semibold mb-3">Import API Collections</h3>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Import from OpenAPI</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Automatically generate requests from an OpenAPI 3.0 specification:
                    </p>
                    <div className="bg-muted p-3 rounded text-sm space-y-1">
                      <div>1. Click "Import" in sidebar</div>
                      <div>2. Go to "OpenAPI" tab</div>
                      <div>3. Enter OpenAPI spec URL</div>
                      <div>4. Click "Import from OpenAPI"</div>
                      <div>5. All endpoints created automatically!</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Import from CURL</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Paste a CURL command to create a request:
                    </p>
                    <div className="bg-muted p-3 rounded font-mono text-xs">
{`curl -X POST https://api.example.com/users \\
  -H 'Content-Type: application/json' \\
  -d '{"name": "John"}'`}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Import from File</h4>
                    <p className="text-sm text-muted-foreground">
                      Upload a local OpenAPI JSON or YAML file to import all endpoints.
                    </p>
                  </div>

                  <div className="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950 p-3 rounded">
                    <p className="text-sm font-semibold mb-1">💡 Pro Tip</p>
                    <p className="text-sm text-muted-foreground">
                      After importing, requests use <code className="bg-muted px-1 rounded">{"{{baseUrl}}"}</code>
                      variables. Create an environment and set the baseUrl to switch between servers!
                    </p>
                  </div>
                </div>
              </section>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
