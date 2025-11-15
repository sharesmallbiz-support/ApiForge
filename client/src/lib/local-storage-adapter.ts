import { localStorageService } from "./local-storage-service";

/**
 * LocalStorage adapter that mimics the API fetch interface
 * This allows us to use localStorage with minimal changes to existing code
 */
export async function localStorageRequest(
  method: string,
  path: string,
  body?: any
): Promise<Response> {
  try {
    const parts = path.split("/").filter(Boolean);
    const resource = parts[1]; // "workspaces", "collections", etc.
    const id = parts[2]; // ID if present

    let result: any;

    // Route to appropriate localStorage method
    switch (resource) {
      case "workspaces":
        result = await handleWorkspaces(method, id, body);
        break;
      case "collections":
        result = await handleCollections(method, id, body, parts);
        break;
      case "folders":
        result = await handleFolders(method, id, body);
        break;
      case "requests":
        result = await handleRequests(method, id, body, parts);
        break;
      case "environments":
        result = await handleEnvironments(method, id, body);
        break;
      case "workflows":
        result = await handleWorkflows(method, id, body, parts);
        break;
      default:
        throw new Error(`Unknown resource: ${resource}`);
    }

    // Return a Response-like object
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

async function handleWorkspaces(method: string, id?: string, body?: any) {
  switch (method) {
    case "GET":
      if (id) {
        const workspace = await localStorageService.getWorkspace(id);
        return { workspace };
      }
      const workspaces = await localStorageService.getWorkspaces();
      return { workspaces };
    case "POST":
      const workspace = await localStorageService.createWorkspace(body);
      return { workspace };
    case "PUT":
      const updated = await localStorageService.updateWorkspace(id!, body);
      return { workspace: updated };
    case "DELETE":
      const success = await localStorageService.deleteWorkspace(id!);
      return { success };
    default:
      throw new Error(`Unsupported method: ${method}`);
  }
}

async function handleCollections(method: string, id?: string, body?: any, parts?: string[]) {
  // Handle import endpoint
  if (parts && parts[2] === "import") {
    // This is handled separately - just create the collection
    const collection = await localStorageService.createCollection(body);
    return { collection };
  }

  switch (method) {
    case "GET":
      if (id) {
        const collection = await localStorageService.getCollection(id);
        return { collection };
      }
      const collections = await localStorageService.getCollections();
      return { collections };
    case "POST":
      const collection = await localStorageService.createCollection(body);
      return { collection };
    case "PUT":
      const updated = await localStorageService.updateCollection(id!, body);
      return { collection: updated };
    case "DELETE":
      const success = await localStorageService.deleteCollection(id!);
      return { success };
    default:
      throw new Error(`Unsupported method: ${method}`);
  }
}

async function handleFolders(method: string, id?: string, body?: any) {
  switch (method) {
    case "POST":
      const folder = await localStorageService.createFolder(body);
      return { folder };
    case "PUT":
      const updated = await localStorageService.updateFolder(id!, body);
      return { folder: updated };
    case "DELETE":
      const success = await localStorageService.deleteFolder(id!);
      return { success };
    default:
      throw new Error(`Unsupported method: ${method}`);
  }
}

async function handleRequests(method: string, id?: string, body?: any, parts?: string[]) {
  // Handle execute and history endpoints - these go to the server
  if (id && (parts?.[3] === "execute" || parts?.[3] === "history")) {
    // These should be handled by the actual server
    throw new Error("Execute and history endpoints must use server");
  }

  switch (method) {
    case "GET":
      if (id) {
        const request = await localStorageService.getRequest(id);
        return { request };
      }
      throw new Error("List all requests not supported");
    case "POST":
      const request = await localStorageService.createRequest(body);
      return { request };
    case "PUT":
      const updated = await localStorageService.updateRequest(id!, body);
      return { request: updated };
    case "DELETE":
      const success = await localStorageService.deleteRequest(id!);
      return { success };
    default:
      throw new Error(`Unsupported method: ${method}`);
  }
}

async function handleEnvironments(method: string, id?: string, body?: any) {
  switch (method) {
    case "GET":
      if (id) {
        const environment = await localStorageService.getEnvironment(id);
        return { environment };
      }
      const environments = await localStorageService.getEnvironments();
      return { environments };
    case "POST":
      const environment = await localStorageService.createEnvironment(body);
      return { environment };
    case "PUT":
      const updated = await localStorageService.updateEnvironment(id!, body);
      return { environment: updated };
    case "DELETE":
      const success = await localStorageService.deleteEnvironment(id!);
      return { success };
    default:
      throw new Error(`Unsupported method: ${method}`);
  }
}

async function handleWorkflows(method: string, id?: string, body?: any, parts?: string[]) {
  // Handle execute endpoint - goes to server
  if (id && parts?.[3] === "execute") {
    throw new Error("Execute endpoint must use server");
  }

  switch (method) {
    case "GET":
      if (id) {
        const workflow = await localStorageService.getWorkflow(id);
        return { workflow };
      }
      const workflows = await localStorageService.getWorkflows();
      return { workflows };
    case "POST":
      const workflow = await localStorageService.createWorkflow(body);
      return { workflow };
    case "PUT":
      const updated = await localStorageService.updateWorkflow(id!, body);
      return { workflow: updated };
    case "DELETE":
      const success = await localStorageService.deleteWorkflow(id!);
      return { success };
    default:
      throw new Error(`Unsupported method: ${method}`);
  }
}
