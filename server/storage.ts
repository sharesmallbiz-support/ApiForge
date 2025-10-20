import { randomUUID } from "crypto";
import type {
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

export interface IStorage {
  // Collections
  getCollections(): Promise<Collection[]>;
  getCollection(id: string): Promise<Collection | undefined>;
  createCollection(collection: InsertCollection): Promise<Collection>;
  updateCollection(id: string, collection: Partial<InsertCollection>): Promise<Collection | undefined>;
  deleteCollection(id: string): Promise<boolean>;

  // Folders
  getFolder(id: string): Promise<Folder | undefined>;
  createFolder(folder: InsertFolder): Promise<Folder>;
  updateFolder(id: string, folder: Partial<InsertFolder>): Promise<Folder | undefined>;
  deleteFolder(id: string): Promise<boolean>;

  // Requests
  getRequest(id: string): Promise<Request | undefined>;
  createRequest(request: InsertRequest): Promise<Request>;
  updateRequest(id: string, request: Partial<InsertRequest>): Promise<Request | undefined>;
  deleteRequest(id: string): Promise<boolean>;

  // Environments
  getEnvironments(): Promise<Environment[]>;
  getEnvironment(id: string): Promise<Environment | undefined>;
  createEnvironment(environment: InsertEnvironment): Promise<Environment>;
  updateEnvironment(id: string, environment: Partial<InsertEnvironment>): Promise<Environment | undefined>;
  deleteEnvironment(id: string): Promise<boolean>;

  // Workflows
  getWorkflows(): Promise<Workflow[]>;
  getWorkflow(id: string): Promise<Workflow | undefined>;
  createWorkflow(workflow: InsertWorkflow): Promise<Workflow>;
  updateWorkflow(id: string, workflow: Partial<InsertWorkflow>): Promise<Workflow | undefined>;
  deleteWorkflow(id: string): Promise<boolean>;

  // Execution Results
  saveExecutionResult(result: ExecutionResult): Promise<ExecutionResult>;
  getExecutionResults(requestId: string): Promise<ExecutionResult[]>;
}

export class MemStorage implements IStorage {
  private collections: Map<string, Collection>;
  private folders: Map<string, Folder>;
  private requests: Map<string, Request>;
  private environments: Map<string, Environment>;
  private workflows: Map<string, Workflow>;
  private executionResults: Map<string, ExecutionResult[]>;

  constructor() {
    this.collections = new Map();
    this.folders = new Map();
    this.requests = new Map();
    this.environments = new Map();
    this.workflows = new Map();
    this.executionResults = new Map();
    
    // Initialize with mock data
    this.initializeMockData();
  }

  private initializeMockData() {
    // Create sample environments
    const devEnv: Environment = {
      id: "env-dev",
      name: "Development",
      variables: [
        { key: "baseUrl", value: "https://dev-api.example.com", enabled: true },
        { key: "apiKey", value: "dev-key-12345", enabled: true },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const testEnv: Environment = {
      id: "env-test",
      name: "Test",
      variables: [
        { key: "baseUrl", value: "https://test-api.example.com", enabled: true },
        { key: "apiKey", value: "test-key-67890", enabled: true },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const prodEnv: Environment = {
      id: "env-prod",
      name: "Production",
      variables: [
        { key: "baseUrl", value: "https://api.example.com", enabled: true },
        { key: "apiKey", value: "prod-key-abcde", enabled: true },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    this.environments.set(devEnv.id, devEnv);
    this.environments.set(testEnv.id, testEnv);
    this.environments.set(prodEnv.id, prodEnv);

    // Create sample collection
    const collection: Collection = {
      id: "col-1",
      name: "User Management API",
      description: "API for managing users and authentication",
      folders: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.collections.set(collection.id, collection);

    // Create folders
    const authFolder: Folder = {
      id: "folder-auth",
      name: "Authentication",
      collectionId: collection.id,
      requests: [],
    };
    
    const usersFolder: Folder = {
      id: "folder-users",
      name: "Users",
      collectionId: collection.id,
      requests: [],
    };
    
    this.folders.set(authFolder.id, authFolder);
    this.folders.set(usersFolder.id, usersFolder);

    // Create requests
    const loginRequest: Request = {
      id: "req-login",
      name: "Login",
      method: "POST",
      url: "{{baseUrl}}/auth/login",
      folderId: authFolder.id,
      headers: [
        { key: "Content-Type", value: "application/json", enabled: true },
      ],
      params: [],
      body: {
        type: "json",
        content: JSON.stringify({ email: "user@example.com", password: "password123" }, null, 2),
      },
      script: `// Extract token from response and save to environment
const response = pm.response.json();
if (response.token) {
  pm.environment.set("token", response.token);
  console.log("Token saved to environment:", response.token);
}`,
    };
    
    const listUsersRequest: Request = {
      id: "req-list-users",
      name: "List Users",
      method: "GET",
      url: "{{baseUrl}}/users",
      folderId: usersFolder.id,
      headers: [
        { key: "Authorization", value: "Bearer {{token}}", enabled: true },
      ],
      params: [
        { key: "page", value: "1", enabled: true },
        { key: "limit", value: "10", enabled: true },
      ],
    };
    
    const createUserRequest: Request = {
      id: "req-create-user",
      name: "Create User",
      method: "POST",
      url: "{{baseUrl}}/users",
      folderId: usersFolder.id,
      headers: [
        { key: "Content-Type", value: "application/json", enabled: true },
        { key: "Authorization", value: "Bearer {{token}}", enabled: true },
      ],
      params: [],
      body: {
        type: "json",
        content: JSON.stringify({ 
          name: "John Doe", 
          email: "john@example.com", 
          role: "user" 
        }, null, 2),
      },
    };
    
    this.requests.set(loginRequest.id, loginRequest);
    this.requests.set(listUsersRequest.id, listUsersRequest);
    this.requests.set(createUserRequest.id, createUserRequest);
  }

  // Collections
  async getCollections(): Promise<Collection[]> {
    const collections = Array.from(this.collections.values());
    return collections.map(col => this.hydrateCollection(col));
  }

  async getCollection(id: string): Promise<Collection | undefined> {
    const collection = this.collections.get(id);
    if (!collection) return undefined;
    return this.hydrateCollection(collection);
  }

  private hydrateCollection(collection: Collection): Collection {
    const folders = Array.from(this.folders.values())
      .filter(f => f.collectionId === collection.id)
      .map(folder => this.hydrateFolder(folder));
    
    return {
      ...collection,
      folders,
    };
  }

  private hydrateFolder(folder: Folder): Folder {
    const requests = Array.from(this.requests.values())
      .filter(r => r.folderId === folder.id);
    
    return {
      ...folder,
      requests,
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
    this.collections.set(collection.id, collection);
    return collection;
  }

  async updateCollection(id: string, update: Partial<InsertCollection>): Promise<Collection | undefined> {
    const collection = this.collections.get(id);
    if (!collection) return undefined;
    
    const updated: Collection = {
      ...collection,
      ...update,
      updatedAt: new Date().toISOString(),
    };
    this.collections.set(id, updated);
    return updated;
  }

  async deleteCollection(id: string): Promise<boolean> {
    const collection = this.collections.get(id);
    if (!collection) return false;
    
    // Get all folders in this collection
    const foldersToDelete = Array.from(this.folders.values())
      .filter(f => f.collectionId === id);
    
    // Delete all requests in those folders
    for (const folder of foldersToDelete) {
      const requestsToDelete = Array.from(this.requests.values())
        .filter(r => r.folderId === folder.id);
      
      // Delete execution results for each request
      for (const request of requestsToDelete) {
        this.executionResults.delete(request.id);
        this.requests.delete(request.id);
      }
      
      this.folders.delete(folder.id);
    }
    
    return this.collections.delete(id);
  }

  // Folders
  async getFolder(id: string): Promise<Folder | undefined> {
    return this.folders.get(id);
  }

  async createFolder(insertFolder: InsertFolder): Promise<Folder> {
    // Validate collection exists
    const collection = this.collections.get(insertFolder.collectionId);
    if (!collection) {
      throw new Error(`Collection ${insertFolder.collectionId} not found`);
    }
    
    const folder: Folder = {
      ...insertFolder,
      id: randomUUID(),
      requests: [],
    };
    this.folders.set(folder.id, folder);
    
    // Update collection timestamp
    collection.updatedAt = new Date().toISOString();
    
    return folder;
  }

  async updateFolder(id: string, update: Partial<InsertFolder>): Promise<Folder | undefined> {
    const folder = this.folders.get(id);
    if (!folder) return undefined;
    
    const updated: Folder = {
      ...folder,
      ...update,
    };
    this.folders.set(id, updated);
    return updated;
  }

  async deleteFolder(id: string): Promise<boolean> {
    const folder = this.folders.get(id);
    if (!folder) return false;
    
    // Delete all requests in folder and their execution results
    const requestsToDelete = Array.from(this.requests.values())
      .filter(r => r.folderId === id);
    
    for (const request of requestsToDelete) {
      this.executionResults.delete(request.id);
      this.requests.delete(request.id);
    }
    
    // Update collection timestamp
    const collection = this.collections.get(folder.collectionId);
    if (collection) {
      collection.updatedAt = new Date().toISOString();
    }
    
    return this.folders.delete(id);
  }

  // Requests
  async getRequest(id: string): Promise<Request | undefined> {
    return this.requests.get(id);
  }

  async createRequest(insertRequest: InsertRequest): Promise<Request> {
    // Validate folder exists
    const folder = this.folders.get(insertRequest.folderId);
    if (!folder) {
      throw new Error(`Folder ${insertRequest.folderId} not found`);
    }
    
    const request: Request = {
      ...insertRequest,
      id: randomUUID(),
    };
    this.requests.set(request.id, request);
    
    return request;
  }

  async updateRequest(id: string, update: Partial<InsertRequest>): Promise<Request | undefined> {
    const request = this.requests.get(id);
    if (!request) return undefined;
    
    const updated: Request = {
      ...request,
      ...update,
    };
    this.requests.set(id, updated);
    return updated;
  }

  async deleteRequest(id: string): Promise<boolean> {
    // Delete execution results for this request
    this.executionResults.delete(id);
    return this.requests.delete(id);
  }

  // Environments
  async getEnvironments(): Promise<Environment[]> {
    return Array.from(this.environments.values());
  }

  async getEnvironment(id: string): Promise<Environment | undefined> {
    return this.environments.get(id);
  }

  async createEnvironment(insertEnvironment: InsertEnvironment): Promise<Environment> {
    const environment: Environment = {
      ...insertEnvironment,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.environments.set(environment.id, environment);
    return environment;
  }

  async updateEnvironment(id: string, update: Partial<InsertEnvironment>): Promise<Environment | undefined> {
    const environment = this.environments.get(id);
    if (!environment) return undefined;
    
    const updated: Environment = {
      ...environment,
      ...update,
      updatedAt: new Date().toISOString(),
    };
    this.environments.set(id, updated);
    return updated;
  }

  async deleteEnvironment(id: string): Promise<boolean> {
    return this.environments.delete(id);
  }

  // Workflows
  async getWorkflows(): Promise<Workflow[]> {
    return Array.from(this.workflows.values());
  }

  async getWorkflow(id: string): Promise<Workflow | undefined> {
    return this.workflows.get(id);
  }

  async createWorkflow(insertWorkflow: InsertWorkflow): Promise<Workflow> {
    const workflow: Workflow = {
      ...insertWorkflow,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.workflows.set(workflow.id, workflow);
    return workflow;
  }

  async updateWorkflow(id: string, update: Partial<InsertWorkflow>): Promise<Workflow | undefined> {
    const workflow = this.workflows.get(id);
    if (!workflow) return undefined;
    
    const updated: Workflow = {
      ...workflow,
      ...update,
      updatedAt: new Date().toISOString(),
    };
    this.workflows.set(id, updated);
    return updated;
  }

  async deleteWorkflow(id: string): Promise<boolean> {
    return this.workflows.delete(id);
  }

  // Execution Results
  async saveExecutionResult(result: ExecutionResult): Promise<ExecutionResult> {
    const results = this.executionResults.get(result.requestId) || [];
    results.push(result);
    this.executionResults.set(result.requestId, results);
    return result;
  }

  async getExecutionResults(requestId: string): Promise<ExecutionResult[]> {
    return this.executionResults.get(requestId) || [];
  }
}

export const storage = new MemStorage();
