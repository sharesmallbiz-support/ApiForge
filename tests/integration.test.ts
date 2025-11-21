import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

// @ts-ignore
global.localStorage = mockLocalStorage;

describe('Integration Tests', () => {
  beforeEach(async () => {
    mockLocalStorage.clear();
    vi.resetModules();
    const { localStorageService } = await import('../client/src/lib/local-storage-service');
    localStorageService.clearAll(false);
    await localStorageService.createWorkspace({ name: 'My Workspace', description: 'Default workspace' });
  });

  describe('Complete CRUD Workflow', () => {
    it('should create workspace → collection → folder → request', async () => {
      const { localStorageService } = await import('../client/src/lib/local-storage-service');

      // 1. Get default workspace
      const workspaces = await localStorageService.getWorkspaces();
      expect(workspaces).toHaveLength(1);
      const workspace = workspaces[0];

      // 2. Create collection
      const collection = await localStorageService.createCollection({
        name: 'API Tests',
        description: 'Integration test collection',
        workspaceId: workspace.id,
      });

      // 3. Create folder
      const folder = await localStorageService.createFolder({
        name: 'User Endpoints',
        collectionId: collection.id,
      });

      // 4. Create request
      const request = await localStorageService.createRequest({
        name: 'Get Users',
        method: 'GET',
        url: 'https://api.example.com/users',
        folderId: folder.id,
        headers: [{ key: 'Authorization', value: 'Bearer token', enabled: true }],
        params: [{ key: 'page', value: '1', enabled: true }],
      });

      // 5. Verify hierarchy
      const retrievedWorkspace = await localStorageService.getWorkspace(workspace.id);
      expect(retrievedWorkspace?.collections).toHaveLength(1);

      const retrievedCollection = await localStorageService.getCollection(collection.id);
      expect(retrievedCollection?.folders).toHaveLength(1);

      const retrievedFolder = await localStorageService.getFolder(folder.id);
      expect(retrievedFolder?.requests).toHaveLength(1);

      // 6. Verify data integrity
      expect(request.name).toBe('Get Users');
      expect(request.method).toBe('GET');
      expect(request.headers).toHaveLength(1);
      expect(request.params).toHaveLength(1);
    });

    it('should handle cascade delete: collection → folders → requests', async () => {
      const { localStorageService } = await import('../client/src/lib/local-storage-service');

      const workspaces = await localStorageService.getWorkspaces();
      const workspace = workspaces[0];

      // Create hierarchy
      const collection = await localStorageService.createCollection({
        name: 'To Delete',
        workspaceId: workspace.id,
      });

      const folder1 = await localStorageService.createFolder({
        name: 'Folder 1',
        collectionId: collection.id,
      });

      const folder2 = await localStorageService.createFolder({
        name: 'Folder 2',
        collectionId: collection.id,
      });

      const request1 = await localStorageService.createRequest({
        name: 'Request 1',
        method: 'GET',
        url: 'https://api.example.com',
        folderId: folder1.id,
        headers: [],
        params: [],
      });

      const request2 = await localStorageService.createRequest({
        name: 'Request 2',
        method: 'POST',
        url: 'https://api.example.com',
        folderId: folder2.id,
        headers: [],
        params: [],
      });

      // Delete collection
      const success = await localStorageService.deleteCollection(collection.id);
      expect(success).toBe(true);

      // Verify cascade delete
      const retrievedCollection = await localStorageService.getCollection(collection.id);
      expect(retrievedCollection).toBeUndefined();

      const retrievedFolder1 = await localStorageService.getFolder(folder1.id);
      expect(retrievedFolder1).toBeUndefined();

      const retrievedFolder2 = await localStorageService.getFolder(folder2.id);
      expect(retrievedFolder2).toBeUndefined();

      const retrievedRequest1 = await localStorageService.getRequest(request1.id);
      expect(retrievedRequest1).toBeUndefined();

      const retrievedRequest2 = await localStorageService.getRequest(request2.id);
      expect(retrievedRequest2).toBeUndefined();
    });

    it('should handle cascade delete: folder → requests', async () => {
      const { localStorageService } = await import('../client/src/lib/local-storage-service');

      const workspaces = await localStorageService.getWorkspaces();
      const workspace = workspaces[0];

      const collection = await localStorageService.createCollection({
        name: 'Test Collection',
        workspaceId: workspace.id,
      });

      const folder = await localStorageService.createFolder({
        name: 'To Delete',
        collectionId: collection.id,
      });

      const request1 = await localStorageService.createRequest({
        name: 'Request 1',
        method: 'GET',
        url: 'https://api.example.com',
        folderId: folder.id,
        headers: [],
        params: [],
      });

      const request2 = await localStorageService.createRequest({
        name: 'Request 2',
        method: 'GET',
        url: 'https://api.example.com',
        folderId: folder.id,
        headers: [],
        params: [],
      });

      // Delete folder
      const success = await localStorageService.deleteFolder(folder.id);
      expect(success).toBe(true);

      // Verify cascade delete
      const retrievedFolder = await localStorageService.getFolder(folder.id);
      expect(retrievedFolder).toBeUndefined();

      const retrievedRequest1 = await localStorageService.getRequest(request1.id);
      expect(retrievedRequest1).toBeUndefined();

      const retrievedRequest2 = await localStorageService.getRequest(request2.id);
      expect(retrievedRequest2).toBeUndefined();

      // Collection should still exist
      const retrievedCollection = await localStorageService.getCollection(collection.id);
      expect(retrievedCollection).toBeDefined();
    });
  });

  describe('CURL Import Workflow', () => {
    it('should parse CURL and create request with all components', async () => {
      const { parseCurlCommand } = await import('../shared/curl-parser');
      const { localStorageService } = await import('../client/src/lib/local-storage-service');

      const curl = `curl -X POST 'https://api.example.com/users?page=1' \\
        -H 'Content-Type: application/json' \\
        -H 'Authorization: Bearer token123' \\
        -d '{"name":"John Doe","email":"john@example.com"}'`;

      const parsed = parseCurlCommand(curl);
      expect(parsed).not.toBeNull();

      // Create collection and folder
      const workspaces = await localStorageService.getWorkspaces();
      const collection = await localStorageService.createCollection({
        name: 'Imported APIs',
        workspaceId: workspaces[0].id,
      });

      const folder = await localStorageService.createFolder({
        name: 'User APIs',
        collectionId: collection.id,
      });

      // Create request from parsed CURL
      const request = await localStorageService.createRequest({
        name: parsed!.url.split('/').pop() || 'Imported Request',
        method: parsed!.method as "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
        url: parsed!.url,
        folderId: folder.id,
        headers: parsed!.headers,
        params: parsed!.params,
        body: parsed!.body ? { type: 'json', content: parsed!.body } : undefined,
      });

      // Verify request
      expect(request.method).toBe('POST');
      expect(request.url).toBe('https://api.example.com/users');
      expect(request.headers).toHaveLength(2);
      expect(request.params).toHaveLength(1);
      expect(request.params[0].key).toBe('page');
      expect(request.params[0].value).toBe('1');
      expect(request.body).toBeDefined();
    });

    it('should handle complex CURL with multiple headers and special characters', async () => {
      const { parseCurlCommand } = await import('../shared/curl-parser');

      const curl = `curl --location 'https://api.example.com/endpoint' \\
--header 'X-API-KEY: 12345-67890' \\
--header 'X-CorrelationId: test-correlation' \\
--header 'X-SessionId: test-session' \\
--header 'User-Agent: Mozilla/5.0,(Windows NT 10.0; Win64; x64),AppleWebKit/537.36' \\
--header 'Accept: application/json' \\
--header 'Accept-Language: en-US,en; q=0.9' \\
--header 'Content-Type: application/json'`;

      const parsed = parseCurlCommand(curl);

      expect(parsed).not.toBeNull();
      expect(parsed?.headers).toHaveLength(7);
      expect(parsed?.headers.find(h => h.key === 'X-API-KEY')?.value).toBe('12345-67890');
      expect(parsed?.headers.find(h => h.key === 'User-Agent')?.value).toContain('Mozilla/5.0');

      // Ensure no duplicate headers
      const headerKeys = parsed!.headers.map(h => h.key);
      const uniqueKeys = new Set(headerKeys);
      expect(headerKeys.length).toBe(uniqueKeys.size);
    });
  });

  describe('Environment Variables Workflow', () => {
    it('should create environment with variables', async () => {
      const { localStorageService } = await import('../client/src/lib/local-storage-service');

      const environment = await localStorageService.createEnvironment({
        name: 'Development',
        headers: [],
        variables: [
          { key: 'API_URL', value: 'https://dev.api.example.com', enabled: true, scope: 'global' },
          { key: 'API_KEY', value: 'dev-key-123', enabled: true, scope: 'global' },
        ],
      });

      expect(environment.variables).toHaveLength(2);

      // Update environment
      const updated = await localStorageService.updateEnvironment(environment.id, {
        variables: [
          ...environment.variables,
          { key: 'NEW_VAR', value: 'new-value', enabled: true, scope: 'global' },
        ],
      });

      expect(updated?.variables).toHaveLength(3);
    });

    it('should manage multiple environments', async () => {
      const { localStorageService } = await import('../client/src/lib/local-storage-service');

      const dev = await localStorageService.createEnvironment({
        name: 'Development',
        headers: [],
        variables: [{ key: 'ENV', value: 'dev', enabled: true, scope: 'global' }],
      });

      const staging = await localStorageService.createEnvironment({
        name: 'Staging',
        headers: [],
        variables: [{ key: 'ENV', value: 'staging', enabled: true, scope: 'global' }],
      });

      const prod = await localStorageService.createEnvironment({
        name: 'Production',
        headers: [],
        variables: [{ key: 'ENV', value: 'prod', enabled: true, scope: 'global' }],
      });

      const environments = await localStorageService.getEnvironments();
      expect(environments).toHaveLength(3);
      expect(environments.map(e => e.name)).toContain('Development');
      expect(environments.map(e => e.name)).toContain('Staging');
      expect(environments.map(e => e.name)).toContain('Production');
    });
  });

  describe('Update Operations', () => {
    it('should update request and preserve relationships', async () => {
      const { localStorageService } = await import('../client/src/lib/local-storage-service');

      const workspaces = await localStorageService.getWorkspaces();
      const collection = await localStorageService.createCollection({
        name: 'Test',
        workspaceId: workspaces[0].id,
      });

      const folder = await localStorageService.createFolder({
        name: 'Test',
        collectionId: collection.id,
      });

      const request = await localStorageService.createRequest({
        name: 'Original',
        method: 'GET',
        url: 'https://api.example.com/v1',
        folderId: folder.id,
        headers: [],
        params: [],
      });

      // Update request
      const updated = await localStorageService.updateRequest(request.id, {
        name: 'Updated',
        method: 'POST',
        url: 'https://api.example.com/v2',
        headers: [{ key: 'Authorization', value: 'Bearer token', enabled: true }],
        params: [{ key: 'page', value: '1', enabled: true }],
        body: { type: 'json', content: '{"test": true}' },
      });

      expect(updated?.name).toBe('Updated');
      expect(updated?.method).toBe('POST');
      expect(updated?.url).toBe('https://api.example.com/v2');
      expect(updated?.headers).toHaveLength(1);
      expect(updated?.params).toHaveLength(1);
      expect(updated?.body).toBeDefined();
      expect(updated?.folderId).toBe(folder.id); // Relationship preserved
    });

    it('should rename items at all levels', async () => {
      const { localStorageService } = await import('../client/src/lib/local-storage-service');

      const workspaces = await localStorageService.getWorkspaces();
      const workspace = workspaces[0];

      const collection = await localStorageService.createCollection({
        name: 'Original Collection',
        workspaceId: workspace.id,
      });

      const folder = await localStorageService.createFolder({
        name: 'Original Folder',
        collectionId: collection.id,
      });

      const request = await localStorageService.createRequest({
        name: 'Original Request',
        method: 'GET',
        url: 'https://api.example.com',
        folderId: folder.id,
        headers: [],
        params: [],
      });

      // Rename all
      await localStorageService.updateWorkspace(workspace.id, { name: 'Renamed Workspace' });
      await localStorageService.updateCollection(collection.id, { name: 'Renamed Collection' });
      await localStorageService.updateFolder(folder.id, { name: 'Renamed Folder' });
      await localStorageService.updateRequest(request.id, { name: 'Renamed Request' });

      // Verify
      const w = await localStorageService.getWorkspace(workspace.id);
      const c = await localStorageService.getCollection(collection.id);
      const f = await localStorageService.getFolder(folder.id);
      const r = await localStorageService.getRequest(request.id);

      expect(w?.name).toBe('Renamed Workspace');
      expect(c?.name).toBe('Renamed Collection');
      expect(f?.name).toBe('Renamed Folder');
      expect(r?.name).toBe('Renamed Request');
    });
  });

  describe('Adapter Integration', () => {
    it('should route through adapter for full CRUD cycle', async () => {
      const { localStorageRequest } = await import('../client/src/lib/local-storage-adapter');

      // Create workspace
      const createResponse = await localStorageRequest('POST', '/api/workspaces', {
        name: 'Adapter Test',
      });
      const createData = await createResponse.json();
      const workspaceId = createData.workspace.id;

      // Read workspace
      const getResponse = await localStorageRequest('GET', `/api/workspaces/${workspaceId}`);
      const getData = await getResponse.json();
      expect(getData.workspace.name).toBe('Adapter Test');

      // Update workspace
      const updateResponse = await localStorageRequest('PATCH', `/api/workspaces/${workspaceId}`, {
        name: 'Updated via Adapter',
      });
      const updateData = await updateResponse.json();
      expect(updateData.workspace.name).toBe('Updated via Adapter');

      // Delete workspace
      const deleteResponse = await localStorageRequest('DELETE', `/api/workspaces/${workspaceId}`);
      const deleteData = await deleteResponse.json();
      expect(deleteData.success).toBe(true);
    });

    it('should handle errors gracefully through adapter', async () => {
      const { localStorageRequest } = await import('../client/src/lib/local-storage-adapter');

      // Try to get non-existent resource
      const response = await localStorageRequest('GET', '/api/workspaces/non-existent-id');
      const data = await response.json();

      // Should return null/undefined for missing resource
      expect(data.workspace).toBeUndefined();
    });
  });

  describe('Data Persistence', () => {
    it('should persist all data to localStorage', async () => {
      const { localStorageService } = await import('../client/src/lib/local-storage-service');

      const workspaces = await localStorageService.getWorkspaces();
      const collection = await localStorageService.createCollection({
        name: 'Persistent',
        workspaceId: workspaces[0].id,
      });

      const folder = await localStorageService.createFolder({
        name: 'Persistent Folder',
        collectionId: collection.id,
      });

      const request = await localStorageService.createRequest({
        name: 'Persistent Request',
        method: 'GET',
        url: 'https://api.example.com',
        folderId: folder.id,
        headers: [],
        params: [],
      });

      // Verify all data is in localStorage
      expect(mockLocalStorage.getItem('apiforge-workspaces')).toBeTruthy();
      expect(mockLocalStorage.getItem('apiforge-collections')).toBeTruthy();
      expect(mockLocalStorage.getItem('apiforge-folders')).toBeTruthy();
      expect(mockLocalStorage.getItem('apiforge-requests')).toBeTruthy();

      // Verify data integrity
      const collectionsData = JSON.parse(mockLocalStorage.getItem('apiforge-collections')!);
      expect(collectionsData.find((c: any) => c.id === collection.id)).toBeDefined();

      const foldersData = JSON.parse(mockLocalStorage.getItem('apiforge-folders')!);
      expect(foldersData.find((f: any) => f.id === folder.id)).toBeDefined();

      const requestsData = JSON.parse(mockLocalStorage.getItem('apiforge-requests')!);
      expect(requestsData.find((r: any) => r.id === request.id)).toBeDefined();
    });

    it('should handle localStorage quota exceeded error', async () => {
      const { localStorageService } = await import('../client/src/lib/local-storage-service');

      // Mock setItem to throw quota exceeded error
      const originalSetItem = mockLocalStorage.setItem;
      mockLocalStorage.setItem = () => {
        throw new Error('QuotaExceededError');
      };

      const workspaces = await localStorageService.getWorkspaces();

      await expect(
        localStorageService.createCollection({
          name: 'Test',
          workspaceId: workspaces[0].id,
        })
      ).rejects.toThrow();

      // Restore
      mockLocalStorage.setItem = originalSetItem;
    });
  });

  describe('Workflow Tests', () => {
    it('should create and manage workflows', async () => {
      const { localStorageService } = await import('../client/src/lib/local-storage-service');

      const workflow = await localStorageService.createWorkflow({
        name: 'User Registration Flow',
        description: 'Test workflow',
        steps: [
          { id: 'step-1', requestId: 'req-1', order: 1, extractVariables: [] },
          { id: 'step-2', requestId: 'req-2', order: 2, extractVariables: [] },
        ],
      });

      expect(workflow.name).toBe('User Registration Flow');
      expect(workflow.steps).toHaveLength(2);

      // Update workflow
      const updated = await localStorageService.updateWorkflow(workflow.id, {
        steps: [
          { id: 'step-1', requestId: 'req-1', order: 1, extractVariables: [] },
          { id: 'step-2', requestId: 'req-2', order: 2, extractVariables: [] },
          { id: 'step-3', requestId: 'req-3', order: 3, extractVariables: [] },
        ],
      });

      expect(updated?.steps).toHaveLength(3);
    });

    it('should list and filter workflows', async () => {
      const { localStorageService } = await import('../client/src/lib/local-storage-service');

      await localStorageService.createWorkflow({
        name: 'Flow 1',
        steps: [],
      });

      await localStorageService.createWorkflow({
        name: 'Flow 2',
        steps: [],
      });

      const workflows = await localStorageService.getWorkflows();
      expect(workflows).toHaveLength(2);
    });
  });
});
