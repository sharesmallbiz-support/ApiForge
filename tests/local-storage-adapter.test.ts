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

describe('LocalStorage Adapter', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    vi.resetModules();
  });

  describe('Workspaces', () => {
    it('should handle GET all workspaces', async () => {
      const { localStorageRequest } = await import('../client/src/lib/local-storage-adapter');

      const response = await localStorageRequest('GET', '/api/workspaces');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
      expect(data.workspaces).toBeDefined();
      expect(Array.isArray(data.workspaces)).toBe(true);
    });

    it('should handle GET single workspace', async () => {
      const { localStorageRequest } = await import('../client/src/lib/local-storage-adapter');
      const { localStorageService } = await import('../client/src/lib/local-storage-service');

      const workspace = await localStorageService.createWorkspace({ name: 'Test' });

      const response = await localStorageRequest('GET', `/api/workspaces/${workspace.id}`);
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.workspace).toBeDefined();
      expect(data.workspace.id).toBe(workspace.id);
    });

    it('should handle POST workspace', async () => {
      const { localStorageRequest } = await import('../client/src/lib/local-storage-adapter');

      const response = await localStorageRequest('POST', '/api/workspaces', {
        name: 'New Workspace',
        description: 'Test description',
      });
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.workspace).toBeDefined();
      expect(data.workspace.name).toBe('New Workspace');
      expect(data.workspace.description).toBe('Test description');
    });

    it('should handle PUT workspace', async () => {
      const { localStorageRequest } = await import('../client/src/lib/local-storage-adapter');
      const { localStorageService } = await import('../client/src/lib/local-storage-service');

      const workspace = await localStorageService.createWorkspace({ name: 'Original' });

      const response = await localStorageRequest('PUT', `/api/workspaces/${workspace.id}`, {
        name: 'Updated',
      });
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.workspace.name).toBe('Updated');
    });

    it('should handle PATCH workspace', async () => {
      const { localStorageRequest } = await import('../client/src/lib/local-storage-adapter');
      const { localStorageService } = await import('../client/src/lib/local-storage-service');

      const workspace = await localStorageService.createWorkspace({ name: 'Original' });

      const response = await localStorageRequest('PATCH', `/api/workspaces/${workspace.id}`, {
        name: 'Patched',
      });
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.workspace.name).toBe('Patched');
    });

    it('should handle DELETE workspace', async () => {
      const { localStorageRequest } = await import('../client/src/lib/local-storage-adapter');
      const { localStorageService } = await import('../client/src/lib/local-storage-service');

      const workspace = await localStorageService.createWorkspace({ name: 'To Delete' });

      const response = await localStorageRequest('DELETE', `/api/workspaces/${workspace.id}`);
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
    });
  });

  describe('Collections', () => {
    it('should handle GET all collections', async () => {
      const { localStorageRequest } = await import('../client/src/lib/local-storage-adapter');

      const response = await localStorageRequest('GET', '/api/collections');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.collections).toBeDefined();
      expect(Array.isArray(data.collections)).toBe(true);
    });

    it('should handle GET single collection', async () => {
      const { localStorageRequest } = await import('../client/src/lib/local-storage-adapter');
      const { localStorageService } = await import('../client/src/lib/local-storage-service');

      const workspaces = await localStorageService.getWorkspaces();
      const collection = await localStorageService.createCollection({
        name: 'Test Collection',
        workspaceId: workspaces[0].id,
      });

      const response = await localStorageRequest('GET', `/api/collections/${collection.id}`);
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.collection).toBeDefined();
      expect(data.collection.id).toBe(collection.id);
    });

    it('should handle POST collection', async () => {
      const { localStorageRequest } = await import('../client/src/lib/local-storage-adapter');
      const { localStorageService } = await import('../client/src/lib/local-storage-service');

      const workspaces = await localStorageService.getWorkspaces();

      const response = await localStorageRequest('POST', '/api/collections', {
        name: 'New Collection',
        workspaceId: workspaces[0].id,
      });
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.collection).toBeDefined();
      expect(data.collection.name).toBe('New Collection');
    });

    it('should handle PATCH collection', async () => {
      const { localStorageRequest } = await import('../client/src/lib/local-storage-adapter');
      const { localStorageService } = await import('../client/src/lib/local-storage-service');

      const workspaces = await localStorageService.getWorkspaces();
      const collection = await localStorageService.createCollection({
        name: 'Original',
        workspaceId: workspaces[0].id,
      });

      const response = await localStorageRequest('PATCH', `/api/collections/${collection.id}`, {
        name: 'Patched',
      });
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.collection.name).toBe('Patched');
    });

    it('should handle DELETE collection', async () => {
      const { localStorageRequest } = await import('../client/src/lib/local-storage-adapter');
      const { localStorageService } = await import('../client/src/lib/local-storage-service');

      const workspaces = await localStorageService.getWorkspaces();
      const collection = await localStorageService.createCollection({
        name: 'To Delete',
        workspaceId: workspaces[0].id,
      });

      const response = await localStorageRequest('DELETE', `/api/collections/${collection.id}`);
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
    });
  });

  describe('Folders', () => {
    it('should handle POST folder', async () => {
      const { localStorageRequest } = await import('../client/src/lib/local-storage-adapter');
      const { localStorageService } = await import('../client/src/lib/local-storage-service');

      const workspaces = await localStorageService.getWorkspaces();
      const collection = await localStorageService.createCollection({
        name: 'Test Collection',
        workspaceId: workspaces[0].id,
      });

      const response = await localStorageRequest('POST', '/api/folders', {
        name: 'New Folder',
        collectionId: collection.id,
      });
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.folder).toBeDefined();
      expect(data.folder.name).toBe('New Folder');
    });

    it('should handle PATCH folder', async () => {
      const { localStorageRequest } = await import('../client/src/lib/local-storage-adapter');
      const { localStorageService } = await import('../client/src/lib/local-storage-service');

      const workspaces = await localStorageService.getWorkspaces();
      const collection = await localStorageService.createCollection({
        name: 'Test Collection',
        workspaceId: workspaces[0].id,
      });
      const folder = await localStorageService.createFolder({
        name: 'Original',
        collectionId: collection.id,
      });

      const response = await localStorageRequest('PATCH', `/api/folders/${folder.id}`, {
        name: 'Patched',
      });
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.folder.name).toBe('Patched');
    });

    it('should handle DELETE folder', async () => {
      const { localStorageRequest } = await import('../client/src/lib/local-storage-adapter');
      const { localStorageService } = await import('../client/src/lib/local-storage-service');

      const workspaces = await localStorageService.getWorkspaces();
      const collection = await localStorageService.createCollection({
        name: 'Test Collection',
        workspaceId: workspaces[0].id,
      });
      const folder = await localStorageService.createFolder({
        name: 'To Delete',
        collectionId: collection.id,
      });

      const response = await localStorageRequest('DELETE', `/api/folders/${folder.id}`);
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
    });
  });

  describe('Requests', () => {
    it('should handle GET single request', async () => {
      const { localStorageRequest } = await import('../client/src/lib/local-storage-adapter');
      const { localStorageService } = await import('../client/src/lib/local-storage-service');

      const workspaces = await localStorageService.getWorkspaces();
      const collection = await localStorageService.createCollection({
        name: 'Test Collection',
        workspaceId: workspaces[0].id,
      });
      const folder = await localStorageService.createFolder({
        name: 'Test Folder',
        collectionId: collection.id,
      });
      const request = await localStorageService.createRequest({
        name: 'Test Request',
        method: 'GET',
        url: 'https://api.example.com',
        folderId: folder.id,
        headers: [],
        params: [],
      });

      const response = await localStorageRequest('GET', `/api/requests/${request.id}`);
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.request).toBeDefined();
      expect(data.request.id).toBe(request.id);
    });

    it('should handle POST request', async () => {
      const { localStorageRequest } = await import('../client/src/lib/local-storage-adapter');
      const { localStorageService } = await import('../client/src/lib/local-storage-service');

      const workspaces = await localStorageService.getWorkspaces();
      const collection = await localStorageService.createCollection({
        name: 'Test Collection',
        workspaceId: workspaces[0].id,
      });
      const folder = await localStorageService.createFolder({
        name: 'Test Folder',
        collectionId: collection.id,
      });

      const response = await localStorageRequest('POST', '/api/requests', {
        name: 'New Request',
        method: 'POST',
        url: 'https://api.example.com',
        folderId: folder.id,
        headers: [],
        params: [],
      });
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.request).toBeDefined();
      expect(data.request.name).toBe('New Request');
    });

    it('should handle PATCH request', async () => {
      const { localStorageRequest } = await import('../client/src/lib/local-storage-adapter');
      const { localStorageService } = await import('../client/src/lib/local-storage-service');

      const workspaces = await localStorageService.getWorkspaces();
      const collection = await localStorageService.createCollection({
        name: 'Test Collection',
        workspaceId: workspaces[0].id,
      });
      const folder = await localStorageService.createFolder({
        name: 'Test Folder',
        collectionId: collection.id,
      });
      const request = await localStorageService.createRequest({
        name: 'Original',
        method: 'GET',
        url: 'https://api.example.com',
        folderId: folder.id,
        headers: [],
        params: [],
      });

      const response = await localStorageRequest('PATCH', `/api/requests/${request.id}`, {
        name: 'Patched',
      });
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.request.name).toBe('Patched');
    });

    it('should handle DELETE request', async () => {
      const { localStorageRequest } = await import('../client/src/lib/local-storage-adapter');
      const { localStorageService } = await import('../client/src/lib/local-storage-service');

      const workspaces = await localStorageService.getWorkspaces();
      const collection = await localStorageService.createCollection({
        name: 'Test Collection',
        workspaceId: workspaces[0].id,
      });
      const folder = await localStorageService.createFolder({
        name: 'Test Folder',
        collectionId: collection.id,
      });
      const request = await localStorageService.createRequest({
        name: 'To Delete',
        method: 'GET',
        url: 'https://api.example.com',
        folderId: folder.id,
        headers: [],
        params: [],
      });

      const response = await localStorageRequest('DELETE', `/api/requests/${request.id}`);
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
    });

    it('should throw error for execute endpoint', async () => {
      const { localStorageRequest } = await import('../client/src/lib/local-storage-adapter');

      const response = await localStorageRequest('POST', '/api/requests/123/execute');

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Execute');
    });

    it('should throw error for history endpoint', async () => {
      const { localStorageRequest } = await import('../client/src/lib/local-storage-adapter');

      const response = await localStorageRequest('GET', '/api/requests/123/history');

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('history');
    });
  });

  describe('Environments', () => {
    it('should handle GET all environments', async () => {
      const { localStorageRequest } = await import('../client/src/lib/local-storage-adapter');

      const response = await localStorageRequest('GET', '/api/environments');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.environments).toBeDefined();
      expect(Array.isArray(data.environments)).toBe(true);
    });

    it('should handle GET single environment', async () => {
      const { localStorageRequest } = await import('../client/src/lib/local-storage-adapter');
      const { localStorageService } = await import('../client/src/lib/local-storage-service');

      const environment = await localStorageService.createEnvironment({
        name: 'Test',
        variables: [],
      });

      const response = await localStorageRequest('GET', `/api/environments/${environment.id}`);
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.environment).toBeDefined();
      expect(data.environment.id).toBe(environment.id);
    });

    it('should handle POST environment', async () => {
      const { localStorageRequest } = await import('../client/src/lib/local-storage-adapter');

      const response = await localStorageRequest('POST', '/api/environments', {
        name: 'New Environment',
        variables: [],
      });
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.environment).toBeDefined();
      expect(data.environment.name).toBe('New Environment');
    });

    it('should handle PATCH environment', async () => {
      const { localStorageRequest } = await import('../client/src/lib/local-storage-adapter');
      const { localStorageService } = await import('../client/src/lib/local-storage-service');

      const environment = await localStorageService.createEnvironment({
        name: 'Original',
        variables: [],
      });

      const response = await localStorageRequest('PATCH', `/api/environments/${environment.id}`, {
        name: 'Patched',
      });
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.environment.name).toBe('Patched');
    });

    it('should handle DELETE environment', async () => {
      const { localStorageRequest } = await import('../client/src/lib/local-storage-adapter');
      const { localStorageService } = await import('../client/src/lib/local-storage-service');

      const environment = await localStorageService.createEnvironment({
        name: 'To Delete',
        variables: [],
      });

      const response = await localStorageRequest('DELETE', `/api/environments/${environment.id}`);
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
    });
  });

  describe('Workflows', () => {
    it('should handle GET all workflows', async () => {
      const { localStorageRequest } = await import('../client/src/lib/local-storage-adapter');

      const response = await localStorageRequest('GET', '/api/workflows');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.workflows).toBeDefined();
      expect(Array.isArray(data.workflows)).toBe(true);
    });

    it('should handle GET single workflow', async () => {
      const { localStorageRequest } = await import('../client/src/lib/local-storage-adapter');
      const { localStorageService } = await import('../client/src/lib/local-storage-service');

      const workflow = await localStorageService.createWorkflow({
        name: 'Test Workflow',
        steps: [],
      });

      const response = await localStorageRequest('GET', `/api/workflows/${workflow.id}`);
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.workflow).toBeDefined();
      expect(data.workflow.id).toBe(workflow.id);
    });

    it('should handle POST workflow', async () => {
      const { localStorageRequest } = await import('../client/src/lib/local-storage-adapter');

      const response = await localStorageRequest('POST', '/api/workflows', {
        name: 'New Workflow',
        steps: [],
      });
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.workflow).toBeDefined();
      expect(data.workflow.name).toBe('New Workflow');
    });

    it('should handle PATCH workflow', async () => {
      const { localStorageRequest } = await import('../client/src/lib/local-storage-adapter');
      const { localStorageService } = await import('../client/src/lib/local-storage-service');

      const workflow = await localStorageService.createWorkflow({
        name: 'Original',
        steps: [],
      });

      const response = await localStorageRequest('PATCH', `/api/workflows/${workflow.id}`, {
        name: 'Patched',
      });
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.workflow.name).toBe('Patched');
    });

    it('should handle DELETE workflow', async () => {
      const { localStorageRequest } = await import('../client/src/lib/local-storage-adapter');
      const { localStorageService } = await import('../client/src/lib/local-storage-service');

      const workflow = await localStorageService.createWorkflow({
        name: 'To Delete',
        steps: [],
      });

      const response = await localStorageRequest('DELETE', `/api/workflows/${workflow.id}`);
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
    });

    it('should throw error for execute endpoint', async () => {
      const { localStorageRequest } = await import('../client/src/lib/local-storage-adapter');

      const response = await localStorageRequest('POST', '/api/workflows/123/execute');

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Execute');
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown resource', async () => {
      const { localStorageRequest } = await import('../client/src/lib/local-storage-adapter');

      const response = await localStorageRequest('GET', '/api/unknown');

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Unknown resource');
    });

    it('should handle unsupported method', async () => {
      const { localStorageRequest } = await import('../client/src/lib/local-storage-adapter');

      const response = await localStorageRequest('OPTIONS', '/api/workspaces');

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Unsupported method');
    });

    it('should return proper response format', async () => {
      const { localStorageRequest } = await import('../client/src/lib/local-storage-adapter');

      const response = await localStorageRequest('GET', '/api/workspaces');

      expect(response).toBeInstanceOf(Response);
      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(response.status).toBe(200);
    });
  });

  describe('Path Parsing', () => {
    it('should correctly parse resource from path', async () => {
      const { localStorageRequest } = await import('../client/src/lib/local-storage-adapter');

      // Only test paths that support listing (GET without ID)
      const paths = [
        '/api/workspaces',
        '/api/collections',
        '/api/environments',
        '/api/workflows',
      ];

      for (const path of paths) {
        const response = await localStorageRequest('GET', path);
        expect(response.ok).toBe(true);
      }
    });

    it('should correctly parse ID from path', async () => {
      const { localStorageRequest } = await import('../client/src/lib/local-storage-adapter');
      const { localStorageService } = await import('../client/src/lib/local-storage-service');

      const workspace = await localStorageService.createWorkspace({ name: 'Test' });

      const response = await localStorageRequest('GET', `/api/workspaces/${workspace.id}`);
      const data = await response.json();

      expect(data.workspace.id).toBe(workspace.id);
    });

    it('should handle paths with extra segments', async () => {
      const { localStorageRequest } = await import('../client/src/lib/local-storage-adapter');

      // Should throw error for execute/history endpoints
      const response = await localStorageRequest('POST', '/api/requests/123/execute');

      expect(response.ok).toBe(false);
    });
  });
});
