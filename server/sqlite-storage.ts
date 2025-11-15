import { randomUUID } from "crypto";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq, sql as drizzleSql } from "drizzle-orm";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";
import type {
  Workspace,
  InsertWorkspace,
  Collection,
  InsertCollection,
  Folder,
  InsertFolder,
  Request,
  InsertRequest,
  Environment,
  InsertEnvironment,
  Workflow,
  InsertWorkflow,
  ExecutionResult,
} from "@shared/schema";
import type { IStorage } from "./storage";

export class SqliteStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;
  private sqlite: Database.Database;

  constructor(dbPath: string = "./data/apiforge.db") {
    this.sqlite = new Database(dbPath);
    this.db = drizzle(this.sqlite, { schema });

    // Run migrations
    migrate(this.db, { migrationsFolder: "./drizzle" });

    // Initialize with mock data if empty
    this.initializeMockDataIfEmpty();
  }

  private initializeMockDataIfEmpty() {
    const workspaces = this.sqlite.prepare("SELECT COUNT(*) as count FROM workspaces").get() as { count: number };

    if (workspaces.count === 0) {
      this.initializeMockData();
    }
  }

  private initializeMockData() {
    // Create sample workspace
    const workspaceId = "workspace-1";
    this.db.insert(schema.workspaces).values({
      id: workspaceId,
      name: "My Workspace",
      description: "Main application workspace",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Create Auth collection
    const authCollectionId = "col-auth";
    this.db.insert(schema.collections).values({
      id: authCollectionId,
      name: "Authentication",
      description: "User authentication endpoints",
      workspaceId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Create Category collection
    const categoryCollectionId = "col-category";
    this.db.insert(schema.collections).values({
      id: categoryCollectionId,
      name: "Category Management",
      description: "CRUD operations for categories",
      workspaceId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Create sample environments with scoped variables
    this.db.insert(schema.environments).values({
      id: "env-dev",
      name: "Development",
      variables: JSON.stringify([
        { key: "apiKey", value: "dev-key-12345", enabled: true, scope: "global" },
        { key: "timeout", value: "5000", enabled: true, scope: "global" },
        { key: "tokenUrl", value: "https://dev-auth.example.com/oauth/token", enabled: true, scope: "workspace", scopeId: workspaceId },
        { key: "token", value: "", enabled: true, scope: "workspace", scopeId: workspaceId },
        { key: "categoryId", value: "", enabled: true, scope: "workspace", scopeId: workspaceId },
        { key: "baseUrl", value: "https://bsw-category.azurewebsites.net", enabled: true, scope: "collection", scopeId: categoryCollectionId },
      ]),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    this.db.insert(schema.environments).values({
      id: "env-test",
      name: "Test",
      variables: JSON.stringify([
        { key: "apiKey", value: "test-key-67890", enabled: true, scope: "global" },
        { key: "timeout", value: "3000", enabled: true, scope: "global" },
        { key: "tokenUrl", value: "https://test-auth.example.com/oauth/token", enabled: true, scope: "workspace", scopeId: workspaceId },
        { key: "token", value: "", enabled: true, scope: "workspace", scopeId: workspaceId },
        { key: "categoryId", value: "", enabled: true, scope: "workspace", scopeId: workspaceId },
        { key: "baseUrl", value: "https://test-bsw-category.azurewebsites.net", enabled: true, scope: "collection", scopeId: categoryCollectionId },
      ]),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    this.db.insert(schema.environments).values({
      id: "env-prod",
      name: "Production",
      variables: JSON.stringify([
        { key: "apiKey", value: "prod-key-abcde", enabled: true, scope: "global" },
        { key: "timeout", value: "10000", enabled: true, scope: "global" },
        { key: "tokenUrl", value: "https://auth.example.com/oauth/token", enabled: true, scope: "workspace", scopeId: workspaceId },
        { key: "token", value: "", enabled: true, scope: "workspace", scopeId: workspaceId },
        { key: "categoryId", value: "", enabled: true, scope: "workspace", scopeId: workspaceId },
        { key: "baseUrl", value: "https://bsw-category.azurewebsites.net", enabled: true, scope: "collection", scopeId: categoryCollectionId },
      ]),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Create folders
    const authFolderId = "folder-auth";
    this.db.insert(schema.folders).values({
      id: authFolderId,
      name: "Auth Endpoints",
      collectionId: authCollectionId,
    });

    const categoryFolderId = "folder-category";
    this.db.insert(schema.folders).values({
      id: categoryFolderId,
      name: "Categories",
      collectionId: categoryCollectionId,
    });

    // Create requests
    this.db.insert(schema.requests).values({
      id: "req-login",
      name: "Get OAuth Token",
      method: "POST",
      url: "{{tokenUrl}}",
      folderId: authFolderId,
      headers: JSON.stringify([
        { key: "Content-Type", value: "application/json", enabled: true },
      ]),
      params: JSON.stringify([]),
      body: JSON.stringify({
        type: "json",
        content: JSON.stringify({ email: "user@example.com", password: "password123" }, null, 2),
      }),
      script: `// Extract token from response and save to workspace-scoped environment
const response = pm.response.json();
if (response.token) {
  pm.environment.set("token", response.token);
  console.log("Token saved to workspace environment:", response.token);
}`,
    });

    this.db.insert(schema.requests).values({
      id: "req-list-categories",
      name: "List Categories",
      method: "GET",
      url: "{{baseUrl}}/categories",
      folderId: categoryFolderId,
      headers: JSON.stringify([
        { key: "Authorization", value: "Bearer {{token}}", enabled: true },
      ]),
      params: JSON.stringify([
        { key: "page", value: "1", enabled: false },
        { key: "limit", value: "10", enabled: false },
      ]),
    });

    this.db.insert(schema.requests).values({
      id: "req-get-category",
      name: "Get Category by ID",
      method: "GET",
      url: "{{baseUrl}}/categories/{{categoryId}}",
      folderId: categoryFolderId,
      headers: JSON.stringify([
        { key: "Authorization", value: "Bearer {{token}}", enabled: true },
      ]),
      params: JSON.stringify([]),
    });

    this.db.insert(schema.requests).values({
      id: "req-create-category",
      name: "Create Category",
      method: "POST",
      url: "{{baseUrl}}/categories",
      folderId: categoryFolderId,
      headers: JSON.stringify([
        { key: "Content-Type", value: "application/json", enabled: true },
        { key: "Authorization", value: "Bearer {{token}}", enabled: true },
      ]),
      params: JSON.stringify([]),
      body: JSON.stringify({
        type: "json",
        content: JSON.stringify({ name: "Technology", description: "Tech-related items", active: true }, null, 2),
      }),
      script: `// Save the created category ID for use in other requests
const response = pm.response.json();
if (response.id) {
  pm.environment.set("categoryId", response.id);
  console.log("Category ID saved:", response.id);
}`,
    });

    this.db.insert(schema.requests).values({
      id: "req-update-category",
      name: "Update Category",
      method: "PUT",
      url: "{{baseUrl}}/categories/{{categoryId}}",
      folderId: categoryFolderId,
      headers: JSON.stringify([
        { key: "Content-Type", value: "application/json", enabled: true },
        { key: "Authorization", value: "Bearer {{token}}", enabled: true },
      ]),
      params: JSON.stringify([]),
      body: JSON.stringify({
        type: "json",
        content: JSON.stringify({ name: "Updated Technology", description: "Updated description", active: true }, null, 2),
      }),
    });

    this.db.insert(schema.requests).values({
      id: "req-delete-category",
      name: "Delete Category",
      method: "DELETE",
      url: "{{baseUrl}}/categories/{{categoryId}}",
      folderId: categoryFolderId,
      headers: JSON.stringify([
        { key: "Authorization", value: "Bearer {{token}}", enabled: true },
      ]),
      params: JSON.stringify([]),
    });
  }

  // Workspaces
  async getWorkspaces(): Promise<Workspace[]> {
    const workspaces = this.db.select().from(schema.workspaces).all();
    return Promise.all(workspaces.map(ws => this.hydrateWorkspace(ws)));
  }

  async getWorkspace(id: string): Promise<Workspace | undefined> {
    const workspace = this.db.select().from(schema.workspaces)
      .where(eq(schema.workspaces.id, id)).get();
    if (!workspace) return undefined;
    return this.hydrateWorkspace(workspace);
  }

  private async hydrateWorkspace(workspace: any): Promise<Workspace> {
    const collections = this.db.select().from(schema.collections)
      
      .where(eq(schema.collections.workspaceId, workspace.id)).all();

    const hydratedCollections = await Promise.all(
      collections.map(col => this.hydrateCollection(col))
    );

    return {
      ...workspace,
      collections: hydratedCollections,
    };
  }

  async createWorkspace(insertWorkspace: InsertWorkspace): Promise<Workspace> {
    const workspace: Workspace = {
      ...insertWorkspace,
      id: randomUUID(),
      collections: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.db.insert(schema.workspaces).values({
      id: workspace.id,
      name: workspace.name,
      description: workspace.description,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
    });

    return workspace;
  }

  async updateWorkspace(id: string, update: Partial<InsertWorkspace>): Promise<Workspace | undefined> {
    const existing = await this.getWorkspace(id);
    if (!existing) return undefined;

    this.db.update(schema.workspaces)
      .set({

        ...update,
        updatedAt: new Date().toISOString(),
      })
      
      .where(eq(schema.workspaces.id, id))
      .run();

    return this.getWorkspace(id);
  }

  async deleteWorkspace(id: string): Promise<boolean> {
    const result = this.db.delete(schema.workspaces)
      .where(eq(schema.workspaces.id, id)).run();
    return result.changes > 0;
  }

  // Collections
  async getCollections(): Promise<Collection[]> {
    const collections = this.db.select().from(schema.collections).all();
    return Promise.all(collections.map(col => this.hydrateCollection(col)));
  }

  async getCollection(id: string): Promise<Collection | undefined> {
    const collection = this.db.select().from(schema.collections)
      .where(eq(schema.collections.id, id)).get();
    if (!collection) return undefined;
    return this.hydrateCollection(collection);
  }

  private async hydrateCollection(collection: any): Promise<Collection> {
    const folders = this.db.select().from(schema.folders)
      
      .where(eq(schema.folders.collectionId, collection.id)).all();

    const hydratedFolders = await Promise.all(
      folders.map(folder => this.hydrateFolder(folder))
    );

    return {
      ...collection,
      folders: hydratedFolders,
    };
  }

  private async hydrateFolder(folder: any): Promise<Folder> {
    const requests = this.db.select().from(schema.requests)
      
      .where(eq(schema.requests.folderId, folder.id)).all();

    return {
      ...folder,
      requests: requests.map(req => ({
        ...req,
        headers: JSON.parse(req.headers || "[]"),
        params: JSON.parse(req.params || "[]"),
        body: req.body ? JSON.parse(req.body) : undefined,
        auth: req.auth ? JSON.parse(req.auth) : undefined,
      })),
    };
  }

  async createCollection(insertCollection: InsertCollection): Promise<Collection> {
    const collection: Collection = {
      ...insertCollection,
      id: randomUUID(),
      folders: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.db.insert(schema.collections).values({
      id: collection.id,
      name: collection.name,
      description: collection.description,
      workspaceId: collection.workspaceId,
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt,
    });

    return collection;
  }

  async updateCollection(id: string, update: Partial<InsertCollection>): Promise<Collection | undefined> {
    const existing = await this.getCollection(id);
    if (!existing) return undefined;

    this.db.update(schema.collections)
      .set({

        ...update,
        updatedAt: new Date().toISOString(),
      })
      
      .where(eq(schema.collections.id, id))
      .run();

    return this.getCollection(id);
  }

  async deleteCollection(id: string): Promise<boolean> {
    const result = this.db.delete(schema.collections)
      .where(eq(schema.workspaces.id, id)).run();
    return result.changes > 0;
  }

  // Folders
  async getFolder(id: string): Promise<Folder | undefined> {
    const folder = this.db.select().from(schema.folders)
      .where(eq(schema.folders.id, id)).get();
    if (!folder) return undefined;
    return this.hydrateFolder(folder);
  }

  async createFolder(insertFolder: InsertFolder): Promise<Folder> {
    const folder: Folder = {
      ...insertFolder,
      id: randomUUID(),
      requests: [],
    };

    this.db.insert(schema.folders).values({
      id: folder.id,
      name: folder.name,
      collectionId: folder.collectionId,
    });

    return folder;
  }

  async updateFolder(id: string, update: Partial<InsertFolder>): Promise<Folder | undefined> {
    const existing = await this.getFolder(id);
    if (!existing) return undefined;

    this.db.update(schema.folders)
      .set(update)
      
      .where(eq(schema.folders.id, id))
      .run();

    return this.getFolder(id);
  }

  async deleteFolder(id: string): Promise<boolean> {
    const result = this.db.delete(schema.folders)
      .where(eq(schema.workspaces.id, id)).run();
    return result.changes > 0;
  }

  // Requests
  async getRequest(id: string): Promise<Request | undefined> {
    const request = this.db.select().from(schema.requests)
      .where(eq(schema.requests.id, id)).get();
    if (!request) return undefined;

    return {
      ...request,
      method: request.method as "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
      headers: JSON.parse(request.headers || "[]"),
      params: JSON.parse(request.params || "[]"),
      body: request.body ? JSON.parse(request.body) : undefined,
      auth: request.auth ? JSON.parse(request.auth) : undefined,
      script: request.script || undefined,
    };
  }

  async createRequest(insertRequest: InsertRequest): Promise<Request> {
    const request: Request = {
      ...insertRequest,
      id: randomUUID(),
    };

    this.db.insert(schema.requests).values({
      id: request.id,
      name: request.name,
      method: request.method,
      url: request.url,
      folderId: request.folderId,
      headers: JSON.stringify(request.headers || []),
      params: JSON.stringify(request.params || []),
      body: request.body ? JSON.stringify(request.body) : null,
      auth: request.auth ? JSON.stringify(request.auth) : null,
      script: request.script,
    });

    return request;
  }

  async updateRequest(id: string, update: Partial<InsertRequest>): Promise<Request | undefined> {
    const existing = await this.getRequest(id);
    if (!existing) return undefined;

    const updateData: any = {};
    if (update.name !== undefined) updateData.name = update.name;
    if (update.method !== undefined) updateData.method = update.method;
    if (update.url !== undefined) updateData.url = update.url;
    if (update.headers !== undefined) updateData.headers = JSON.stringify(update.headers);
    if (update.params !== undefined) updateData.params = JSON.stringify(update.params);
    if (update.body !== undefined) updateData.body = JSON.stringify(update.body);
    if (update.auth !== undefined) updateData.auth = JSON.stringify(update.auth);
    if (update.script !== undefined) updateData.script = update.script;

    this.db.update(schema.requests)
      .set(updateData)
      
      .where(eq(schema.requests.id, id))
      .run();

    return this.getRequest(id);
  }

  async deleteRequest(id: string): Promise<boolean> {
    const result = this.db.delete(schema.requests)
      .where(eq(schema.workspaces.id, id)).run();
    return result.changes > 0;
  }

  // Environments
  async getEnvironments(): Promise<Environment[]> {
    const environments = this.db.select().from(schema.environments).all();
    return environments.map(env => ({
      ...env,
      variables: JSON.parse(env.variables || "[]"),
    }));
  }

  async getEnvironment(id: string): Promise<Environment | undefined> {
    const environment = this.db.select().from(schema.environments)
      .where(eq(schema.environments.id, id)).get();
    if (!environment) return undefined;

    return {
      ...environment,
      variables: JSON.parse(environment.variables || "[]"),
    };
  }

  async createEnvironment(insertEnvironment: InsertEnvironment): Promise<Environment> {
    const environment: Environment = {
      ...insertEnvironment,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.db.insert(schema.environments).values({
      id: environment.id,
      name: environment.name,
      variables: JSON.stringify(environment.variables || []),
      createdAt: environment.createdAt,
      updatedAt: environment.updatedAt,
    });

    return environment;
  }

  async updateEnvironment(id: string, update: Partial<InsertEnvironment>): Promise<Environment | undefined> {
    const existing = await this.getEnvironment(id);
    if (!existing) return undefined;

    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };
    if (update.name !== undefined) updateData.name = update.name;
    if (update.variables !== undefined) updateData.variables = JSON.stringify(update.variables);

    this.db.update(schema.environments)
      .set(updateData)
      
      .where(eq(schema.environments.id, id))
      .run();

    return this.getEnvironment(id);
  }

  async deleteEnvironment(id: string): Promise<boolean> {
    const result = this.db.delete(schema.environments)
      .where(eq(schema.workspaces.id, id)).run();
    return result.changes > 0;
  }

  // Workflows
  async getWorkflows(): Promise<Workflow[]> {
    const workflows = this.db.select().from(schema.workflows).all();
    return workflows.map(wf => ({
      ...wf,
      description: wf.description || undefined,
      steps: JSON.parse(wf.steps || "[]"),
    }));
  }

  async getWorkflow(id: string): Promise<Workflow | undefined> {
    const workflow = this.db.select().from(schema.workflows)
      .where(eq(schema.workflows.id, id)).get();
    if (!workflow) return undefined;

    return {
      ...workflow,
      description: workflow.description || undefined,
      steps: JSON.parse(workflow.steps || "[]"),
    };
  }

  async createWorkflow(insertWorkflow: InsertWorkflow): Promise<Workflow> {
    const workflow: Workflow = {
      ...insertWorkflow,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.db.insert(schema.workflows).values({
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      steps: JSON.stringify(workflow.steps || []),
      createdAt: workflow.createdAt,
      updatedAt: workflow.updatedAt,
    });

    return workflow;
  }

  async updateWorkflow(id: string, update: Partial<InsertWorkflow>): Promise<Workflow | undefined> {
    const existing = await this.getWorkflow(id);
    if (!existing) return undefined;

    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };
    if (update.name !== undefined) updateData.name = update.name;
    if (update.description !== undefined) updateData.description = update.description;
    if (update.steps !== undefined) updateData.steps = JSON.stringify(update.steps);

    this.db.update(schema.workflows)
      .set(updateData)
      
      .where(eq(schema.workflows.id, id))
      .run();

    return this.getWorkflow(id);
  }

  async deleteWorkflow(id: string): Promise<boolean> {
    const result = this.db.delete(schema.workflows)
      .where(eq(schema.workspaces.id, id)).run();
    return result.changes > 0;
  }

  // Execution Results
  async saveExecutionResult(result: ExecutionResult): Promise<ExecutionResult> {
    const id = randomUUID();

    this.db.insert(schema.executionResults).values({
      id,
      requestId: result.requestId,
      status: result.status,
      statusText: result.statusText,
      headers: JSON.stringify(result.headers || {}),
      body: result.body,
      time: result.time,
      size: result.size,
      timestamp: result.timestamp,
    });

    return { ...result, id };
  }

  async getExecutionResults(requestId: string): Promise<ExecutionResult[]> {
    const results = this.db.select().from(schema.executionResults)
      
      .where(eq(schema.executionResults.requestId, requestId))
      .all();

    return results.map(result => ({
      ...result,
      headers: JSON.parse(result.headers || "{}"),
    }));
  }
}
