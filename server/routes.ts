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

  app.post("/api/requests/:id/execute", async (req, res) => {
    try {
      const request = await storage.getRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ error: "Request not found" });
      }

      // Mock execution - generate realistic response
      const startTime = Date.now();
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 300));
      
      const endTime = Date.now();
      const time = endTime - startTime;

      // Generate mock response based on method
      let mockBody: any;
      let status: number;
      
      if (request.method === "GET") {
        status = 200;
        if (request.name.toLowerCase().includes("list") || request.name.toLowerCase().includes("users")) {
          mockBody = {
            data: [
              { id: 1, name: "John Doe", email: "john@example.com", role: "admin" },
              { id: 2, name: "Jane Smith", email: "jane@example.com", role: "user" },
              { id: 3, name: "Bob Johnson", email: "bob@example.com", role: "user" },
            ],
            total: 3,
            page: 1,
            limit: 10,
          };
        } else {
          mockBody = {
            id: 1,
            name: "John Doe",
            email: "john@example.com",
            role: "admin",
            createdAt: new Date().toISOString(),
          };
        }
      } else if (request.method === "POST") {
        status = 201;
        if (request.name.toLowerCase().includes("login") || request.name.toLowerCase().includes("auth")) {
          mockBody = {
            token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
            user: {
              id: 1,
              name: "John Doe",
              email: "john@example.com",
            },
          };
        } else {
          mockBody = {
            id: randomUUID(),
            ...JSON.parse(request.body?.content || "{}"),
            createdAt: new Date().toISOString(),
          };
        }
      } else if (request.method === "PUT" || request.method === "PATCH") {
        status = 200;
        mockBody = {
          id: randomUUID(),
          ...JSON.parse(request.body?.content || "{}"),
          updatedAt: new Date().toISOString(),
        };
      } else if (request.method === "DELETE") {
        status = 204;
        mockBody = null;
      } else {
        status = 200;
        mockBody = { success: true };
      }

      const bodyStr = mockBody ? JSON.stringify(mockBody) : "";
      const size = new Blob([bodyStr]).size;


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
