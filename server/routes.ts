/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { randomUUID } from "crypto";
import type { ExecutionResult } from "@shared/schema";
import {
  insertWorkspaceSchema,
  insertCollectionSchema,
  insertFolderSchema,
  insertRequestSchema,
  insertEnvironmentSchema,
  insertWorkflowSchema,
  openApiImportSchema,
  postmanImportSchema,
} from "@shared/schema";
import { executeScript } from "./script-executor";
import { substituteVariables } from "./environment-resolver";
import { executeHttpRequest } from "./http-executor";
import { fetchAndParseOpenAPI } from "./openapi-parser";
import { parsePostmanCollection, parsePostmanEnvironment, type ParsedPostmanFolder } from "./postman-parser";

export async function registerRoutes(app: Express): Promise<Server> {
  // Workspaces
  app.get("/api/workspaces", async (req, res) => {
    try {
      const workspaces = await storage.getWorkspaces();
      res.json({ workspaces });
    } catch (_error) {
      // Error handling intentionally minimal
      res.status(500).json({ error: "Failed to fetch workspaces" });
    }
  });

  app.post("/api/workspaces", async (req, res) => {
    try {
      const data = insertWorkspaceSchema.parse(req.body);
      const workspace = await storage.createWorkspace(data);
      res.status(201).json({ workspace });
    } catch (_error) {
      // Error handling intentionally minimal
      res.status(400).json({ error: "Invalid workspace data" });
    }
  });

  app.get("/api/workspaces/:id", async (req, res) => {
    try {
      const workspace = await storage.getWorkspace(req.params.id);
      if (!workspace) {
        return res.status(404).json({ error: "Workspace not found" });
      }
      res.json({ workspace });
    } catch (_error) {
      // Error handling intentionally minimal
      res.status(500).json({ error: "Failed to fetch workspace" });
    }
  });

  app.put("/api/workspaces/:id", async (req, res) => {
    try {
      const data = insertWorkspaceSchema.partial().parse(req.body);
      const workspace = await storage.updateWorkspace(req.params.id, data);
      if (!workspace) {
        return res.status(404).json({ error: "Workspace not found" });
      }
      res.json({ workspace });
    } catch (_error) {
      // Error handling intentionally minimal
      res.status(400).json({ error: "Invalid workspace data" });
    }
  });

  app.delete("/api/workspaces/:id", async (req, res) => {
    try {
      const success = await storage.deleteWorkspace(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Workspace not found" });
      }
      res.json({ success: true });
    } catch (_error) {
      // Error handling intentionally minimal
      res.status(500).json({ error: "Failed to delete workspace" });
    }
  });

  // Collections
  app.get("/api/collections", async (req, res) => {
    try {
      const collections = await storage.getCollections();
      res.json({ collections });
    } catch (_error) {
      // Error handling intentionally minimal
      res.status(500).json({ error: "Failed to fetch collections" });
    }
  });

  app.post("/api/collections", async (req, res) => {
    try {
      const data = insertCollectionSchema.parse(req.body);
      const collection = await storage.createCollection(data);
      res.status(201).json({ collection });
    } catch (_error) {
      // Error handling intentionally minimal
      res.status(400).json({ error: "Invalid collection data" });
    }
  });

  app.get("/api/collections/:id", async (req, res) => {
    try {
      const collection = await storage.getCollection(req.params.id);
      if (!collection) {
        return res.status(404).json({ error: "Collection not found" });
      }
      res.json({ collection });
    } catch (_error) {
      // Error handling intentionally minimal
      res.status(500).json({ error: "Failed to fetch collection" });
    }
  });

  app.put("/api/collections/:id", async (req, res) => {
    try {
      const data = insertCollectionSchema.partial().parse(req.body);
      const collection = await storage.updateCollection(req.params.id, data);
      if (!collection) {
        return res.status(404).json({ error: "Collection not found" });
      }
      res.json({ collection });
    } catch (_error) {
      // Error handling intentionally minimal
      res.status(400).json({ error: "Invalid collection data" });
    }
  });

  app.delete("/api/collections/:id", async (req, res) => {
    try {
      const success = await storage.deleteCollection(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Collection not found" });
      }
      res.json({ success: true });
    } catch (_error) {
      // Error handling intentionally minimal
      res.status(500).json({ error: "Failed to delete collection" });
    }
  });

  app.post("/api/collections/import", async (req, res) => {
    try {
      const data = openApiImportSchema.parse(req.body);

      if (!data.url && !data.spec) {
        return res.status(400).json({ error: "Either OpenAPI URL or spec data is required" });
      }

      // Parse OpenAPI spec
      const parsedApi = await fetchAndParseOpenAPI(data.url, data.spec);

      // Create collection with parsed data
      const collection = await storage.createCollection({
        name: parsedApi.title,
        description: parsedApi.description,
        workspaceId: data.workspaceId,
      });

      // Create environment for this collection with extracted variables
      let environment = null;
      if (parsedApi.environmentVariables.length > 0 || parsedApi.environmentHeaders.length > 0) {
        // Set scopeId for collection-scoped variables
        const variables = parsedApi.environmentVariables.map(v => ({
          ...v,
          scopeId: v.scope === "collection" ? collection.id : v.scopeId,
        }));

        environment = await storage.createEnvironment({
          name: `${parsedApi.title} Environment`,
          variables,
          headers: parsedApi.environmentHeaders,
        });
      }

      // Group requests by path prefix to organize into folders
      const folderMap = new Map<string, string>();

      for (const request of parsedApi.requests) {
        // Determine folder name from path (use first segment after /)
        const pathSegments = request.path.split('/').filter(s => s);
        const folderName = pathSegments[0] || "General";

        // Get or create folder
        let folderId = folderMap.get(folderName);
        if (!folderId) {
          const folder = await storage.createFolder({
            name: folderName.charAt(0).toUpperCase() + folderName.slice(1),
            collectionId: collection.id,
          });
          folderId = folder.id;
          folderMap.set(folderName, folderId);
        }

        // Create request
        await storage.createRequest({
          name: request.name,
          method: request.method as "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
          url: `{{baseUrl}}${request.path}`,
          folderId: folderId,
          headers: request.headers,
          params: request.params,
          body: request.body ? {
            type: (request.body.type === 'text' || request.body.type === 'xml') ? 'raw' : request.body.type as "json" | "form" | "raw",
            content: request.body.content,
          } : undefined,
        });
      }

      const updatedCollection = await storage.getCollection(collection.id);
      res.status(201).json({
        collection: updatedCollection,
        environment: environment
      });
    } catch (_error) {
      // Error handling intentionally minimal
      console.error("OpenAPI import error:", _error);
      res.status(400).json({
        error: _error instanceof Error ? _error.message : "Failed to import OpenAPI spec"
      });
    }
  });

  app.post("/api/collections/import-postman", async (req, res) => {
    try {
      const data = postmanImportSchema.parse(req.body);

      if (!data.collection && !data.environment) {
        return res.status(400).json({ error: "Either Postman collection or environment data is required" });
      }

      let collection = null;
      let environment = null;

      // Parse and import collection if provided
      if (data.collection) {
        const parsedCollection = parsePostmanCollection(data.collection);

        // Create collection
        collection = await storage.createCollection({
          name: parsedCollection.name,
          description: parsedCollection.description,
          workspaceId: data.workspaceId,
        });

        // Recursive function to create folders and their contents
        async function createFolderRecursively(
          folderData: ParsedPostmanFolder,
          collectionId: string,
          parentFolderId?: string
        ): Promise<void> {
          // Create the folder
          const folder = await storage.createFolder({
            name: folderData.name,
            collectionId: parentFolderId ? undefined : collectionId,
            parentId: parentFolderId,
          });

          // Create requests in this folder
          for (const requestData of folderData.requests) {
            await storage.createRequest({
              name: requestData.name,
              method: requestData.method as "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
              url: requestData.url,
              folderId: folder.id,
              headers: requestData.headers,
              params: requestData.params,
              body: requestData.body,
            });
          }

          // Create nested folders recursively
          for (const nestedFolderData of folderData.folders || []) {
            await createFolderRecursively(nestedFolderData, collectionId, folder.id);
          }
        }

        // Create all top-level folders and their contents
        for (const folderData of parsedCollection.folders) {
          await createFolderRecursively(folderData, collection.id);
        }

        collection = await storage.getCollection(collection.id);
      }

      // Parse and import environment if provided
      if (data.environment) {
        const parsedEnvironment = parsePostmanEnvironment(data.environment);

        environment = await storage.createEnvironment({
          name: parsedEnvironment.name,
          variables: parsedEnvironment.variables,
          headers: [],
        });
      }

      res.status(201).json({
        collection,
        environment,
      });
    } catch (_error) {
      // Error handling intentionally minimal
      console.error("Postman import error:", _error);
      res.status(400).json({
        error: _error instanceof Error ? _error.message : "Failed to import Postman data"
      });
    }
  });

  // Folders
  app.post("/api/folders", async (req, res) => {
    try {
      const data = insertFolderSchema.parse(req.body);
      const folder = await storage.createFolder(data);
      res.status(201).json({ folder });
    } catch (_error) {
      // Error handling intentionally minimal
      res.status(400).json({ error: "Invalid folder data" });
    }
  });

  app.put("/api/folders/:id", async (req, res) => {
    try {
      const data = insertFolderSchema.partial().parse(req.body);
      const folder = await storage.updateFolder(req.params.id, data);
      if (!folder) {
        return res.status(404).json({ error: "Folder not found" });
      }
      res.json({ folder });
    } catch (_error) {
      // Error handling intentionally minimal
      res.status(400).json({ error: "Invalid folder data" });
    }
  });

  app.delete("/api/folders/:id", async (req, res) => {
    try {
      const success = await storage.deleteFolder(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Folder not found" });
      }
      res.json({ success: true });
    } catch (_error) {
      // Error handling intentionally minimal
      res.status(500).json({ error: "Failed to delete folder" });
    }
  });

  // Requests
  app.get("/api/requests/:id", async (req, res) => {
    try {
      const request = await storage.getRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ error: "Request not found" });
      }
      res.json({ request });
    } catch (_error) {
      // Error handling intentionally minimal
      res.status(500).json({ error: "Failed to fetch request" });
    }
  });

  app.post("/api/requests", async (req, res) => {
    try {
      const data = insertRequestSchema.parse(req.body);
      const request = await storage.createRequest(data);
      res.status(201).json({ request });
    } catch (_error) {
      // Error handling intentionally minimal
      res.status(400).json({ error: "Invalid request data" });
    }
  });

  app.put("/api/requests/:id", async (req, res) => {
    try {
      const data = insertRequestSchema.partial().parse(req.body);
      const request = await storage.updateRequest(req.params.id, data);
      if (!request) {
        return res.status(404).json({ error: "Request not found" });
      }
      res.json({ request });
    } catch (_error) {
      // Error handling intentionally minimal
      res.status(400).json({ error: "Invalid request data" });
    }
  });

  app.delete("/api/requests/:id", async (req, res) => {
    try {
      const success = await storage.deleteRequest(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Request not found" });
      }
      res.json({ success: true });
    } catch (_error) {
      // Error handling intentionally minimal
      res.status(500).json({ error: "Failed to delete request" });
    }
  });

  app.get("/api/requests/:id/history", async (req, res) => {
    try {
      const results = await storage.getExecutionResults(req.params.id);
      res.json({ results });
    } catch (_error) {
      // Error handling intentionally minimal
      res.status(500).json({ error: "Failed to fetch execution history" });
    }
  });

  app.post("/api/requests/:id/execute", async (req, res) => {
    try {
      // Try to get request from storage first, fallback to request body (for localStorage mode)
      let request = await storage.getRequest(req.params.id);
      if (!request && req.body.request) {
        request = req.body.request;
      }
      if (!request) {
        return res.status(404).json({ error: "Request not found" });
      }

      // Get folder and collection for context (needed for variable resolution)
      // Try storage first, fallback to request body (for localStorage mode)
      let folder = await storage.getFolder(request.folderId);
      if (!folder && req.body.folder) {
        folder = req.body.folder;
      }

      let collection = folder ? await storage.getCollection(folder.collectionId) : undefined;
      if (!collection && req.body.collection) {
        collection = req.body.collection;
      }

      // Get environment if specified, fallback to environment body (for localStorage mode)
      const environmentId = req.body?.environmentId;
      let environment = environmentId ? await storage.getEnvironment(environmentId) : undefined;
      if (!environment && req.body.environment) {
        environment = req.body.environment;
      }

      // Resolve environment variables in URL, headers, params, and body
      // Pass request, folder, and collection in context for localStorage mode
      const context = {
        requestId: req.params.id,
        environmentId,
        request,
        folder: folder || undefined,
        collection: collection || undefined,
      };
      const resolvedUrl = await substituteVariables(request.url, context, environment);

      // Merge environment headers with request headers (request headers take precedence)
      const envHeaders = environment?.headers || [];
      const mergedHeaders = [...envHeaders, ...request.headers];

      const resolvedHeaders = await Promise.all(
        mergedHeaders.map(async h => ({
          ...h,
          value: await substituteVariables(h.value, context, environment)
        }))
      );
      const resolvedParams = await Promise.all(
        request.params.map(async p => ({
          ...p,
          value: await substituteVariables(p.value, context, environment)
        }))
      );

      // Resolve body content if present
      let resolvedBody = request.body?.content || "";
      if (resolvedBody) {
        resolvedBody = await substituteVariables(resolvedBody, context, environment);
      }

      // Execute real HTTP request
      const httpResult = await executeHttpRequest(
        request,
        resolvedUrl,
        resolvedHeaders,
        resolvedParams,
        resolvedBody
      );

      // Create execution result
      const result: ExecutionResult = {
        id: randomUUID(),
        requestId: request.id,
        status: httpResult.status,
        statusText: httpResult.statusText,
        headers: httpResult.headers,
        body: httpResult.body,
        time: httpResult.time,
        size: httpResult.size,
        timestamp: new Date().toISOString(),
      };

      // Save result
      await storage.saveExecutionResult(result);

      // Execute post-request script if present
      if (request.script && environment) {
        const scriptResult = await executeScript(request.script, result, environment);

        // Save updated environment if it was modified
        if (scriptResult.updatedEnvironment && environmentId) {
          environment = scriptResult.updatedEnvironment;
          await storage.updateEnvironment(environmentId, {
            variables: environment.variables,
          });
        }
      }

      // Include resolved request data for verification
      res.json({ 
        result,
        resolvedRequest: {
          url: resolvedUrl,
          headers: resolvedHeaders.filter(h => h.enabled),
          params: resolvedParams.filter(p => p.enabled),
          body: resolvedBody,
        }
      });
    } catch (_error) {
      // Error handling intentionally minimal
      console.error("Execution error:", _error);
      res.status(500).json({ error: "Failed to execute request" });
    }
  });

  // Environments
  app.get("/api/environments", async (req, res) => {
    try {
      const environments = await storage.getEnvironments();
      res.json({ environments });
    } catch (_error) {
      // Error handling intentionally minimal
      res.status(500).json({ error: "Failed to fetch environments" });
    }
  });

  app.post("/api/environments", async (req, res) => {
    try {
      const data = insertEnvironmentSchema.parse(req.body);
      const environment = await storage.createEnvironment(data);
      res.status(201).json({ environment });
    } catch (_error) {
      // Error handling intentionally minimal
      res.status(400).json({ error: "Invalid environment data" });
    }
  });

  app.get("/api/environments/:id", async (req, res) => {
    try {
      const environment = await storage.getEnvironment(req.params.id);
      if (!environment) {
        return res.status(404).json({ error: "Environment not found" });
      }
      res.json({ environment });
    } catch (_error) {
      // Error handling intentionally minimal
      res.status(500).json({ error: "Failed to fetch environment" });
    }
  });

  app.put("/api/environments/:id", async (req, res) => {
    try {
      const data = insertEnvironmentSchema.partial().parse(req.body);
      const environment = await storage.updateEnvironment(req.params.id, data);
      if (!environment) {
        return res.status(404).json({ error: "Environment not found" });
      }
      res.json({ environment });
    } catch (_error) {
      // Error handling intentionally minimal
      res.status(400).json({ error: "Invalid environment data" });
    }
  });

  app.delete("/api/environments/:id", async (req, res) => {
    try {
      const success = await storage.deleteEnvironment(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Environment not found" });
      }
      res.json({ success: true });
    } catch (_error) {
      // Error handling intentionally minimal
      res.status(500).json({ error: "Failed to delete environment" });
    }
  });

  // Workflows
  app.get("/api/workflows", async (req, res) => {
    try {
      const workflows = await storage.getWorkflows();
      res.json({ workflows });
    } catch (_error) {
      // Error handling intentionally minimal
      res.status(500).json({ error: "Failed to fetch workflows" });
    }
  });

  app.post("/api/workflows", async (req, res) => {
    try {
      const data = insertWorkflowSchema.parse(req.body);
      const workflow = await storage.createWorkflow(data);
      res.status(201).json({ workflow });
    } catch (_error) {
      // Error handling intentionally minimal
      res.status(400).json({ error: "Invalid workflow data" });
    }
  });

  app.get("/api/workflows/:id", async (req, res) => {
    try {
      const workflow = await storage.getWorkflow(req.params.id);
      if (!workflow) {
        return res.status(404).json({ error: "Workflow not found" });
      }
      res.json({ workflow });
    } catch (_error) {
      // Error handling intentionally minimal
      res.status(500).json({ error: "Failed to fetch workflow" });
    }
  });

  app.put("/api/workflows/:id", async (req, res) => {
    try {
      const data = insertWorkflowSchema.partial().parse(req.body);
      const workflow = await storage.updateWorkflow(req.params.id, data);
      if (!workflow) {
        return res.status(404).json({ error: "Workflow not found" });
      }
      res.json({ workflow });
    } catch (_error) {
      // Error handling intentionally minimal
      res.status(400).json({ error: "Invalid workflow data" });
    }
  });

  app.delete("/api/workflows/:id", async (req, res) => {
    try {
      const success = await storage.deleteWorkflow(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Workflow not found" });
      }
      res.json({ success: true });
    } catch (_error) {
      // Error handling intentionally minimal
      res.status(500).json({ error: "Failed to delete workflow" });
    }
  });

  app.post("/api/workflows/:id/execute", async (req, res) => {
    try {
      const workflow = await storage.getWorkflow(req.params.id);
      if (!workflow) {
        return res.status(404).json({ error: "Workflow not found" });
      }

      // Mock workflow execution
      const results: ExecutionResult[] = [];
      let allPassed = true;

      for (const step of workflow.steps) {
        const request = await storage.getRequest(step.requestId);
        if (!request) continue;

        // Execute the request (mock)
        const startTime = Date.now();
        await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 150));
        const endTime = Date.now();

        const mockBody = { success: true, data: { id: randomUUID() } };
        const bodyStr = JSON.stringify(mockBody);
        const size = new Blob([bodyStr]).size;

        const result: ExecutionResult = {
          id: randomUUID(),
          requestId: request.id,
          status: 200,
          statusText: "OK",
          headers: {
            "content-type": "application/json",
            "date": new Date().toUTCString(),
          },
          body: mockBody,
          time: endTime - startTime,
          size,
          timestamp: new Date().toISOString(),
        };

        results.push(result);

        // Check assertions
        if (step.assertions) {
          for (const assertion of step.assertions) {
            assertion.passed = Math.random() > 0.2; // 80% pass rate for mock
            if (!assertion.passed) allPassed = false;
          }
        }
      }

      res.json({
        results: {
          steps: results,
          passed: allPassed,
          failedAssertions: workflow.steps
            .flatMap(s => s.assertions || [])
            .filter(a => !a.passed),
        },
      });
    } catch (_error) {
      // Error handling intentionally minimal
      res.status(500).json({ error: "Failed to execute workflow" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function _getStatusText(status: number): string {
  const statusTexts: Record<number, string> = {
    200: "OK",
    201: "Created",
    204: "No Content",
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    500: "Internal Server Error",
  };
  return statusTexts[status] || "Unknown";
}
