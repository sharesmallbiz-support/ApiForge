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

// Browser-compatible UUID generator
function randomUUID(): string {
  return crypto.randomUUID();
}

const STORAGE_VERSION = "1.0";
const STORAGE_KEYS = {
  VERSION: "apiforge-version",
  WORKSPACES: "apiforge-workspaces",
  COLLECTIONS: "apiforge-collections",
  FOLDERS: "apiforge-folders",
  REQUESTS: "apiforge-requests",
  ENVIRONMENTS: "apiforge-environments",
  WORKFLOWS: "apiforge-workflows",
  EXECUTION_RESULTS: "apiforge-execution-results",
  PREFERENCES: "apiforge-preferences",
} as const;

interface StorageData {
  workspaces: Workspace[];
  collections: Collection[];
  folders: Folder[];
  requests: Request[];
  environments: Environment[];
  workflows: Workflow[];
  executionResults: Map<string, ExecutionResult[]>;
}

interface UserPreferences {
  theme: "light" | "dark" | "system";
  lastSelectedWorkspace?: string;
  lastSelectedEnvironment?: string;
  sidebarCollapsed?: boolean;
}

class LocalStorageService {
  private data: StorageData;

  constructor() {
    this.data = this.loadAll();
    this.checkVersion();
  }

  // ========== VERSION & MIGRATION ==========

  private checkVersion() {
    const storedVersion = localStorage.getItem(STORAGE_KEYS.VERSION);
    if (!storedVersion) {
      // First time setup
      localStorage.setItem(STORAGE_KEYS.VERSION, STORAGE_VERSION);
      this.initializeWithMockData();
    } else if (storedVersion !== STORAGE_VERSION) {
      // Handle migration if needed
      console.log(`Migrating from ${storedVersion} to ${STORAGE_VERSION}`);
      localStorage.setItem(STORAGE_KEYS.VERSION, STORAGE_VERSION);
    }
  }

  private initializeWithMockData() {
    // Create default workspace
    const workspace: Workspace = {
      id: randomUUID(),
      name: "My Workspace",
      description: "Default workspace",
      collections: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.data.workspaces = [workspace];
    this.saveWorkspaces();

    // Create sample collection
    const collection: Collection = {
      id: randomUUID(),
      name: "Sample Collection",
      description: "A sample collection to get you started",
      workspaceId: workspace.id,
      folders: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.collections = [collection];
    this.saveCollections();

    // Create sample folder
    const folder: Folder = {
      id: randomUUID(),
      name: "General",
      collectionId: collection.id,
      requests: [],
    };
    this.data.folders = [folder];
    this.saveFolders();

    // Create sample request
    const request: Request = {
      id: randomUUID(),
      name: "Get Example",
      method: "GET",
      url: "https://jsonplaceholder.typicode.com/posts/1",
      folderId: folder.id,
      headers: [],
      params: [],
      hostedRunUrl: "https://portal.azure.com/#@example.com/resource/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/example-rg/providers/Microsoft.Web/staticSites/example-swa/appInsights",
      lastHostedRun: new Date().toISOString(),
      hostedRunResult: "Success",
    };
    this.data.requests = [request];
    this.saveRequests();
  }

  // ========== LOAD & SAVE ==========

  private loadAll(): StorageData {
    return {
      workspaces: this.loadItem<Workspace[]>(STORAGE_KEYS.WORKSPACES, []),
      collections: this.loadItem<Collection[]>(STORAGE_KEYS.COLLECTIONS, []),
      folders: this.loadItem<Folder[]>(STORAGE_KEYS.FOLDERS, []),
      requests: this.loadItem<Request[]>(STORAGE_KEYS.REQUESTS, []),
      environments: this.loadItem<Environment[]>(STORAGE_KEYS.ENVIRONMENTS, []),
      workflows: this.loadItem<Workflow[]>(STORAGE_KEYS.WORKFLOWS, []),
      executionResults: new Map(
        Object.entries(
          this.loadItem<Record<string, ExecutionResult[]>>(STORAGE_KEYS.EXECUTION_RESULTS, {})
        )
      ),
    };
  }

  private loadItem<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error loading ${key}:`, error);
      return defaultValue;
    }
  }

  private saveItem(key: string, value: any) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
      throw new Error(`Failed to save data: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  private saveWorkspaces() {
    this.saveItem(STORAGE_KEYS.WORKSPACES, this.data.workspaces);
  }

  private saveCollections() {
    console.log('[LocalStorageService] saveCollections called, count:', this.data.collections.length);
    this.saveItem(STORAGE_KEYS.COLLECTIONS, this.data.collections);
  }

  private saveFolders() {
    this.saveItem(STORAGE_KEYS.FOLDERS, this.data.folders);
  }

  private saveRequests() {
    this.saveItem(STORAGE_KEYS.REQUESTS, this.data.requests);
  }

  private saveEnvironments() {
    this.saveItem(STORAGE_KEYS.ENVIRONMENTS, this.data.environments);
  }

  private saveWorkflows() {
    this.saveItem(STORAGE_KEYS.WORKFLOWS, this.data.workflows);
  }

  private saveExecutionResults() {
    this.saveItem(
      STORAGE_KEYS.EXECUTION_RESULTS,
      Object.fromEntries(this.data.executionResults)
    );
  }

  // ========== WORKSPACES ==========

  async getWorkspaces(): Promise<Workspace[]> {
    console.log('[LocalStorageService] getWorkspaces called, total collections in memory:', this.data.collections.length);
    return this.data.workspaces.map(ws => this.hydrateWorkspace(ws));
  }

  async getWorkspace(id: string): Promise<Workspace | undefined> {
    const workspace = this.data.workspaces.find(w => w.id === id);
    if (!workspace) return undefined;
    return this.hydrateWorkspace(workspace);
  }

  private hydrateWorkspace(workspace: Workspace): Workspace {
    console.log('[LocalStorageService] hydrateWorkspace for:', workspace.name, 'workspaceId:', workspace.id);
    console.log('[LocalStorageService] Total collections in memory:', this.data.collections.length);
    const collections = this.data.collections
      .filter(c => c.workspaceId === workspace.id)
      .map(collection => this.hydrateCollection(collection));
    console.log('[LocalStorageService] Filtered collections for workspace:', collections.length);
    if (this.data.collections.length > 0) {
      this.data.collections.forEach(c => {
        console.log('[LocalStorageService] Collection:', c.name, 'workspaceId:', c.workspaceId, 'matches:', c.workspaceId === workspace.id);
      });
    }

    return {
      ...workspace,
      collections,
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
    this.data.workspaces.push(workspace);
    this.saveWorkspaces();
    return workspace;
  }

  async updateWorkspace(id: string, update: Partial<InsertWorkspace>): Promise<Workspace | undefined> {
    const index = this.data.workspaces.findIndex(w => w.id === id);
    if (index === -1) return undefined;

    this.data.workspaces[index] = {
      ...this.data.workspaces[index],
      ...update,
      updatedAt: new Date().toISOString(),
    };
    this.saveWorkspaces();
    return this.data.workspaces[index];
  }

  async deleteWorkspace(id: string): Promise<boolean> {
    const index = this.data.workspaces.findIndex(w => w.id === id);
    if (index === -1) return false;

    // Delete all collections in this workspace
    const collectionsToDelete = this.data.collections.filter(c => c.workspaceId === id);
    for (const collection of collectionsToDelete) {
      await this.deleteCollection(collection.id);
    }

    this.data.workspaces.splice(index, 1);
    this.saveWorkspaces();
    return true;
  }

  // ========== COLLECTIONS ==========

  async getCollections(): Promise<Collection[]> {
    return this.data.collections.map(col => this.hydrateCollection(col));
  }

  async getCollection(id: string): Promise<Collection | undefined> {
    const collection = this.data.collections.find(c => c.id === id);
    if (!collection) return undefined;
    return this.hydrateCollection(collection);
  }

  private hydrateCollection(collection: Collection): Collection {
    const folders = this.data.folders
      .filter(f => f.collectionId === collection.id)
      .map(folder => this.hydrateFolder(folder));

    return {
      ...collection,
      folders,
    };
  }

  private hydrateFolder(folder: Folder): Folder {
    const requests = this.data.requests.filter(r => r.folderId === folder.id);

    return {
      ...folder,
      requests,
    };
  }

  async createCollection(insertCollection: InsertCollection): Promise<Collection> {
    console.log('[LocalStorageService] createCollection called with:', insertCollection);
    const collection: Collection = {
      ...insertCollection,
      id: randomUUID(),
      folders: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    console.log('[LocalStorageService] Created collection:', collection);
    console.log('[LocalStorageService] Collections before push:', this.data.collections.length);
    this.data.collections.push(collection);
    console.log('[LocalStorageService] Collections after push:', this.data.collections.length);
    this.saveCollections();
    console.log('[LocalStorageService] Collections saved to localStorage');
    return collection;
  }

  async updateCollection(id: string, update: Partial<InsertCollection>): Promise<Collection | undefined> {
    const index = this.data.collections.findIndex(c => c.id === id);
    if (index === -1) return undefined;

    this.data.collections[index] = {
      ...this.data.collections[index],
      ...update,
      updatedAt: new Date().toISOString(),
    };
    this.saveCollections();
    return this.data.collections[index];
  }

  async deleteCollection(id: string): Promise<boolean> {
    const index = this.data.collections.findIndex(c => c.id === id);
    if (index === -1) return false;

    // Delete all folders in this collection
    const foldersToDelete = this.data.folders.filter(f => f.collectionId === id);
    for (const folder of foldersToDelete) {
      await this.deleteFolder(folder.id);
    }

    this.data.collections.splice(index, 1);
    this.saveCollections();
    return true;
  }

  // ========== FOLDERS ==========

  async getFolder(id: string): Promise<Folder | undefined> {
    const folder = this.data.folders.find(f => f.id === id);
    if (!folder) return undefined;
    return this.hydrateFolder(folder);
  }

  async createFolder(insertFolder: InsertFolder): Promise<Folder> {
    const folder: Folder = {
      ...insertFolder,
      id: randomUUID(),
      requests: [],
    };
    this.data.folders.push(folder);
    this.saveFolders();
    return folder;
  }

  async updateFolder(id: string, update: Partial<InsertFolder>): Promise<Folder | undefined> {
    const index = this.data.folders.findIndex(f => f.id === id);
    if (index === -1) return undefined;

    this.data.folders[index] = {
      ...this.data.folders[index],
      ...update,
    };
    this.saveFolders();
    return this.data.folders[index];
  }

  async deleteFolder(id: string): Promise<boolean> {
    const index = this.data.folders.findIndex(f => f.id === id);
    if (index === -1) return false;

    // Delete all requests in folder
    const requestsToDelete = this.data.requests.filter(r => r.folderId === id);
    for (const request of requestsToDelete) {
      await this.deleteRequest(request.id);
    }

    this.data.folders.splice(index, 1);
    this.saveFolders();
    return true;
  }

  // ========== REQUESTS ==========

  async getRequest(id: string): Promise<Request | undefined> {
    return this.data.requests.find(r => r.id === id);
  }

  async createRequest(insertRequest: InsertRequest): Promise<Request> {
    const request: Request = {
      ...insertRequest,
      id: randomUUID(),
    };
    this.data.requests.push(request);
    this.saveRequests();
    return request;
  }

  async updateRequest(id: string, update: Partial<InsertRequest>): Promise<Request | undefined> {
    const index = this.data.requests.findIndex(r => r.id === id);
    if (index === -1) return undefined;

    this.data.requests[index] = {
      ...this.data.requests[index],
      ...update,
    };
    this.saveRequests();
    return this.data.requests[index];
  }

  async deleteRequest(id: string): Promise<boolean> {
    const index = this.data.requests.findIndex(r => r.id === id);
    if (index === -1) return false;

    // Delete execution results for this request
    this.data.executionResults.delete(id);
    this.saveExecutionResults();

    this.data.requests.splice(index, 1);
    this.saveRequests();
    return true;
  }

  // ========== ENVIRONMENTS ==========

  async getEnvironments(): Promise<Environment[]> {
    return this.data.environments;
  }

  async getEnvironment(id: string): Promise<Environment | undefined> {
    return this.data.environments.find(e => e.id === id);
  }

  async createEnvironment(insertEnvironment: InsertEnvironment): Promise<Environment> {
    const environment: Environment = {
      ...insertEnvironment,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.environments.push(environment);
    this.saveEnvironments();
    return environment;
  }

  async updateEnvironment(id: string, update: Partial<InsertEnvironment>): Promise<Environment | undefined> {
    const index = this.data.environments.findIndex(e => e.id === id);
    if (index === -1) return undefined;

    this.data.environments[index] = {
      ...this.data.environments[index],
      ...update,
      updatedAt: new Date().toISOString(),
    };
    this.saveEnvironments();
    return this.data.environments[index];
  }

  async deleteEnvironment(id: string): Promise<boolean> {
    const index = this.data.environments.findIndex(e => e.id === id);
    if (index === -1) return false;

    this.data.environments.splice(index, 1);
    this.saveEnvironments();
    return true;
  }

  // ========== WORKFLOWS ==========

  async getWorkflows(): Promise<Workflow[]> {
    return this.data.workflows;
  }

  async getWorkflow(id: string): Promise<Workflow | undefined> {
    return this.data.workflows.find(w => w.id === id);
  }

  async createWorkflow(insertWorkflow: InsertWorkflow): Promise<Workflow> {
    const workflow: Workflow = {
      ...insertWorkflow,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.workflows.push(workflow);
    this.saveWorkflows();
    return workflow;
  }

  async updateWorkflow(id: string, update: Partial<InsertWorkflow>): Promise<Workflow | undefined> {
    const index = this.data.workflows.findIndex(w => w.id === id);
    if (index === -1) return undefined;

    this.data.workflows[index] = {
      ...this.data.workflows[index],
      ...update,
      updatedAt: new Date().toISOString(),
    };
    this.saveWorkflows();
    return this.data.workflows[index];
  }

  async deleteWorkflow(id: string): Promise<boolean> {
    const index = this.data.workflows.findIndex(w => w.id === id);
    if (index === -1) return false;

    this.data.workflows.splice(index, 1);
    this.saveWorkflows();
    return true;
  }

  // ========== EXECUTION RESULTS ==========

  async saveExecutionResult(result: ExecutionResult): Promise<ExecutionResult> {
    const results = this.data.executionResults.get(result.requestId) || [];
    results.push(result);
    // Keep only last 50 results per request
    if (results.length > 50) {
      results.shift();
    }
    this.data.executionResults.set(result.requestId, results);
    this.saveExecutionResults();
    return result;
  }

  async getExecutionResults(requestId: string): Promise<ExecutionResult[]> {
    return this.data.executionResults.get(requestId) || [];
  }

  // ========== PREFERENCES ==========

  getPreferences(): UserPreferences {
    return this.loadItem<UserPreferences>(STORAGE_KEYS.PREFERENCES, {
      theme: "system",
    });
  }

  setPreferences(preferences: Partial<UserPreferences>) {
    const current = this.getPreferences();
    const updated = { ...current, ...preferences };
    this.saveItem(STORAGE_KEYS.PREFERENCES, updated);
  }

  // ========== EXPORT / IMPORT ==========

  exportAll(): string {
    const exportData = {
      version: STORAGE_VERSION,
      exportedAt: new Date().toISOString(),
      data: {
        workspaces: this.data.workspaces,
        collections: this.data.collections,
        folders: this.data.folders,
        requests: this.data.requests,
        environments: this.data.environments,
        workflows: this.data.workflows,
        executionResults: Object.fromEntries(this.data.executionResults),
      },
    };
    return JSON.stringify(exportData, null, 2);
  }

  importAll(jsonData: string): void {
    try {
      const importData = JSON.parse(jsonData);

      // Validate data structure
      if (!importData.data) {
        throw new Error("Invalid import format");
      }

      // Import data
      this.data.workspaces = importData.data.workspaces || [];
      this.data.collections = importData.data.collections || [];
      this.data.folders = importData.data.folders || [];
      this.data.requests = importData.data.requests || [];
      this.data.environments = importData.data.environments || [];
      this.data.workflows = importData.data.workflows || [];
      this.data.executionResults = new Map(
        Object.entries(importData.data.executionResults || {})
      );

      // Save all
      this.saveWorkspaces();
      this.saveCollections();
      this.saveFolders();
      this.saveRequests();
      this.saveEnvironments();
      this.saveWorkflows();
      this.saveExecutionResults();
    } catch (error) {
      throw new Error(`Import failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  clearAll(seed: boolean = true): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    this.data = this.loadAll();
    if (seed) {
      this.initializeWithMockData();
    }
  }
}

export const localStorageService = new LocalStorageService();
