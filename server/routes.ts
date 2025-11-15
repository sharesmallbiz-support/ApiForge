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
} from "@shared/schema";
import { executeScript } from "./script-executor";
import { substituteVariables } from "./environment-resolver";
import { executeHttpRequest } from "./http-executor";

export async function registerRoutes(app: Express): Promise<Server> {
  // Workspaces
  app.get("/api/workspaces", async (req, res) => {
    try {
      const workspaces = await storage.getWorkspaces();
      res.json({ workspaces });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch workspaces" });
    }
  });

  app.post("/api/workspaces", async (req, res) => {
    try {
      const data = insertWorkspaceSchema.parse(req.body);
      const workspace = await storage.createWorkspace(data);
      res.status(201).json({ workspace });
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
      res.status(500).json({ error: "Failed to delete workspace" });
    }
  });

  // Collections
  app.get("/api/collections", async (req, res) => {
    try {
      const collections = await storage.getCollections();
      res.json({ collections });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch collections" });
    }
  });

  app.post("/api/collections", async (req, res) => {
    try {
      const data = insertCollectionSchema.parse(req.body);
      const collection = await storage.createCollection(data);
      res.status(201).json({ collection });
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
      res.status(500).json({ error: "Failed to delete collection" });
    }
  });

  app.post("/api/collections/import", async (req, res) => {
    try {
      const data = openApiImportSchema.parse(req.body);
      
      // Mock OpenAPI import - create a sample collection
      const collection = await storage.createCollection({
        name: "Imported API Collection",
        description: `Imported from ${data.url || "OpenAPI spec"}`,
        workspaceId: data.workspaceId,
      });

      // Create a sample folder
      const folder = await storage.createFolder({
        name: "Endpoints",
        collectionId: collection.id,
      });

      // Create sample requests
      await storage.createRequest({
        name: "Sample GET Request",
        method: "GET",
        url: "{{baseUrl}}/endpoint",
        folderId: folder.id,
        headers: [],
        params: [],
      });

      const updatedCollection = await storage.getCollection(collection.id);
      res.status(201).json({ collection: updatedCollection });
    } catch (error) {
      res.status(400).json({ error: "Invalid import data" });
    }
  });

  // Folders
  app.post("/api/folders", async (req, res) => {
    try {
      const data = insertFolderSchema.parse(req.body);
      const folder = await storage.createFolder(data);
      res.status(201).json({ folder });
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch request" });
    }
  });

  app.post("/api/requests", async (req, res) => {
    try {
      const data = insertRequestSchema.parse(req.body);
      const request = await storage.createRequest(data);
      res.status(201).json({ request });
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
      res.status(500).json({ error: "Failed to delete request" });
    }
  });

  app.get("/api/requests/:id/history", async (req, res) => {
    try {
      const results = await storage.getExecutionResults(req.params.id);
      res.json({ results });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch execution history" });
    }
  });

  app.post("/api/requests/:id/execute", async (req, res) => {
    try {
      const request = await storage.getRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ error: "Request not found" });
      }

      // Get environment if specified and resolve variables first
      const environmentId = req.body?.environmentId;
      let environment = environmentId ? await storage.getEnvironment(environmentId) : undefined;

      // Resolve environment variables in URL, headers, params, and body
      const context = { requestId: req.params.id, environmentId };
      const resolvedUrl = await substituteVariables(request.url, context, environment);
      const resolvedHeaders = await Promise.all(
        request.headers.map(async h => ({
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
    } catch (error) {
      console.error("Execution error:", error);
      res.status(500).json({ error: "Failed to execute request" });
    }
  });

  // Environments
  app.get("/api/environments", async (req, res) => {
    try {
      const environments = await storage.getEnvironments();
      res.json({ environments });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch environments" });
    }
  });

  app.post("/api/environments", async (req, res) => {
    try {
      const data = insertEnvironmentSchema.parse(req.body);
      const environment = await storage.createEnvironment(data);
      res.status(201).json({ environment });
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
      res.status(500).json({ error: "Failed to delete environment" });
    }
  });

  // Workflows
  app.get("/api/workflows", async (req, res) => {
    try {
      const workflows = await storage.getWorkflows();
      res.json({ workflows });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch workflows" });
    }
  });

  app.post("/api/workflows", async (req, res) => {
    try {
      const data = insertWorkflowSchema.parse(req.body);
      const workflow = await storage.createWorkflow(data);
      res.status(201).json({ workflow });
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
      res.status(500).json({ error: "Failed to execute workflow" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function getStatusText(status: number): string {
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
