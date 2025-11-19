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

describe('LocalStorage Service', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    // Reset the module to get fresh instance
    vi.resetModules();
  });

  describe('Workspaces', () => {
    it('should create default workspace on first load', async () => {
      const { localStorageService } = await import('../client/src/lib/local-storage-service');

      const workspaces = await localStorageService.getWorkspaces();

      expect(workspaces).toHaveLength(1);
      expect(workspaces[0].name).toBe('My Workspace');
      expect(workspaces[0].collections).toEqual([]);
    });

    it('should create and retrieve workspace', async () => {
      const { localStorageService } = await import('../client/src/lib/local-storage-service');

      const workspace = await localStorageService.createWorkspace({
        name: 'Test Workspace',
        description: 'Test description',
      });

      expect(workspace.id).toBeTruthy();
      expect(workspace.name).toBe('Test Workspace');
      expect(workspace.description).toBe('Test description');

      const retrieved = await localStorageService.getWorkspace(workspace.id);
      expect(retrieved).toEqual(workspace);
    });

    it('should update workspace', async () => {
      const { localStorageService } = await import('../client/src/lib/local-storage-service');

      const workspace = await localStorageService.createWorkspace({
        name: 'Original Name',
      });

      const updated = await localStorageService.updateWorkspace(workspace.id, {
        name: 'Updated Name',
        description: 'New description',
      });

      expect(updated?.name).toBe('Updated Name');
      expect(updated?.description).toBe('New description');
    });

    it('should delete workspace', async () => {
      const { localStorageService } = await import('../client/src/lib/local-storage-service');

      const workspace = await localStorageService.createWorkspace({
        name: 'To Delete',
      });

      const success = await localStorageService.deleteWorkspace(workspace.id);
      expect(success).toBe(true);

      const retrieved = await localStorageService.getWorkspace(workspace.id);
      expect(retrieved).toBeUndefined();
    });
  });

  describe('Collections', () => {
    it('should create and retrieve collection', async () => {
      const { localStorageService } = await import('../client/src/lib/local-storage-service');

      const workspaces = await localStorageService.getWorkspaces();
      const workspaceId = workspaces[0].id;

      const collection = await localStorageService.createCollection({
        name: 'Test Collection',
        description: 'Test description',
        workspaceId,
      });

      expect(collection.id).toBeTruthy();
      expect(collection.name).toBe('Test Collection');
      expect(collection.workspaceId).toBe(workspaceId);

      const retrieved = await localStorageService.getCollection(collection.id);
      expect(retrieved).toEqual(collection);
    });

    it('should hydrate workspace with collections', async () => {
      const { localStorageService } = await import('../client/src/lib/local-storage-service');

      const workspaces = await localStorageService.getWorkspaces();
      const workspaceId = workspaces[0].id;

      await localStorageService.createCollection({
        name: 'Collection 1',
        workspaceId,
      });

      await localStorageService.createCollection({
        name: 'Collection 2',
        workspaceId,
      });

      const workspace = await localStorageService.getWorkspace(workspaceId);
      expect(workspace?.collections).toHaveLength(2);
    });

    it('should update collection', async () => {
      const { localStorageService } = await import('../client/src/lib/local-storage-service');

      const workspaces = await localStorageService.getWorkspaces();
      const workspaceId = workspaces[0].id;

      const collection = await localStorageService.createCollection({
        name: 'Original',
        workspaceId,
      });

      const updated = await localStorageService.updateCollection(collection.id, {
        name: 'Updated',
      });

      expect(updated?.name).toBe('Updated');
    });

    it('should delete collection and cascade delete folders/requests', async () => {
      const { localStorageService } = await import('../client/src/lib/local-storage-service');

      const workspaces = await localStorageService.getWorkspaces();
      const workspaceId = workspaces[0].id;

      const collection = await localStorageService.createCollection({
        name: 'To Delete',
        workspaceId,
      });

      const folder = await localStorageService.createFolder({
        name: 'Test Folder',
        collectionId: collection.id,
      });

      await localStorageService.createRequest({
        name: 'Test Request',
        method: 'GET',
        url: 'https://api.example.com',
        folderId: folder.id,
        headers: [],
        params: [],
      });

      const success = await localStorageService.deleteCollection(collection.id);
      expect(success).toBe(true);

      // Verify cascade delete
      const retrievedFolder = await localStorageService.getFolder(folder.id);
      expect(retrievedFolder).toBeUndefined();
    });
  });

  describe('Folders', () => {
    it('should create and retrieve folder', async () => {
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

      expect(folder.id).toBeTruthy();
      expect(folder.name).toBe('Test Folder');
      expect(folder.collectionId).toBe(collection.id);

      const retrieved = await localStorageService.getFolder(folder.id);
      expect(retrieved).toEqual(folder);
    });

    it('should hydrate collection with folders', async () => {
      const { localStorageService } = await import('../client/src/lib/local-storage-service');

      const workspaces = await localStorageService.getWorkspaces();
      const collection = await localStorageService.createCollection({
        name: 'Test Collection',
        workspaceId: workspaces[0].id,
      });

      await localStorageService.createFolder({
        name: 'Folder 1',
        collectionId: collection.id,
      });

      await localStorageService.createFolder({
        name: 'Folder 2',
        collectionId: collection.id,
      });

      const retrieved = await localStorageService.getCollection(collection.id);
      expect(retrieved?.folders).toHaveLength(2);
    });

    it('should update folder', async () => {
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

      const updated = await localStorageService.updateFolder(folder.id, {
        name: 'Updated',
      });

      expect(updated?.name).toBe('Updated');
    });

    it('should delete folder and cascade delete requests', async () => {
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

      await localStorageService.createRequest({
        name: 'Test Request',
        method: 'GET',
        url: 'https://api.example.com',
        folderId: folder.id,
        headers: [],
        params: [],
      });

      const success = await localStorageService.deleteFolder(folder.id);
      expect(success).toBe(true);

      const retrieved = await localStorageService.getFolder(folder.id);
      expect(retrieved).toBeUndefined();
    });
  });

  describe('Requests', () => {
    it('should create and retrieve request', async () => {
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
        method: 'POST',
        url: 'https://api.example.com/users',
        folderId: folder.id,
        headers: [{ key: 'Content-Type', value: 'application/json', enabled: true }],
        params: [{ key: 'page', value: '1', enabled: true }],
        body: { type: 'json', content: '{"name":"John"}' },
      });

      expect(request.id).toBeTruthy();
      expect(request.name).toBe('Test Request');
      expect(request.method).toBe('POST');
      expect(request.headers).toHaveLength(1);
      expect(request.params).toHaveLength(1);

      const retrieved = await localStorageService.getRequest(request.id);
      expect(retrieved).toEqual(request);
    });

    it('should update request', async () => {
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

      const updated = await localStorageService.updateRequest(request.id, {
        method: 'POST',
        url: 'https://api.example.com/v2',
        headers: [{ key: 'Authorization', value: 'Bearer token', enabled: true }],
      });

      expect(updated?.method).toBe('POST');
      expect(updated?.url).toBe('https://api.example.com/v2');
      expect(updated?.headers).toHaveLength(1);
    });

    it('should delete request', async () => {
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

      const success = await localStorageService.deleteRequest(request.id);
      expect(success).toBe(true);

      const retrieved = await localStorageService.getRequest(request.id);
      expect(retrieved).toBeUndefined();
    });

    it('should hydrate folder with requests', async () => {
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

      await localStorageService.createRequest({
        name: 'Request 1',
        method: 'GET',
        url: 'https://api.example.com/1',
        folderId: folder.id,
        headers: [],
        params: [],
      });

      await localStorageService.createRequest({
        name: 'Request 2',
        method: 'POST',
        url: 'https://api.example.com/2',
        folderId: folder.id,
        headers: [],
        params: [],
      });

      const retrieved = await localStorageService.getFolder(folder.id);
      expect(retrieved?.requests).toHaveLength(2);
    });
  });

  describe('Environments', () => {
    it('should create and retrieve environment', async () => {
      const { localStorageService } = await import('../client/src/lib/local-storage-service');

      const environment = await localStorageService.createEnvironment({
        name: 'Development',
        variables: [
          { key: 'API_URL', value: 'https://dev.api.example.com', enabled: true, scope: 'global' },
        ],
      });

      expect(environment.id).toBeTruthy();
      expect(environment.name).toBe('Development');
      expect(environment.variables).toHaveLength(1);

      const retrieved = await localStorageService.getEnvironment(environment.id);
      expect(retrieved).toEqual(environment);
    });

    it('should list all environments', async () => {
      const { localStorageService } = await import('../client/src/lib/local-storage-service');

      await localStorageService.createEnvironment({ name: 'Dev', variables: [] });
      await localStorageService.createEnvironment({ name: 'Staging', variables: [] });

      const environments = await localStorageService.getEnvironments();
      expect(environments).toHaveLength(2);
    });

    it('should update environment variables', async () => {
      const { localStorageService } = await import('../client/src/lib/local-storage-service');

      const environment = await localStorageService.createEnvironment({
        name: 'Test',
        variables: [],
      });

      const updated = await localStorageService.updateEnvironment(environment.id, {
        variables: [
          { key: 'VAR1', value: 'value1', enabled: true, scope: 'global' },
          { key: 'VAR2', value: 'value2', enabled: false, scope: 'workspace', scopeId: 'ws-1' },
        ],
      });

      expect(updated?.variables).toHaveLength(2);
      expect(updated?.variables[1].scopeId).toBe('ws-1');
    });
  });

  describe('Data Persistence', () => {
    it('should persist data to localStorage', async () => {
      const { localStorageService } = await import('../client/src/lib/local-storage-service');

      const workspaces = await localStorageService.getWorkspaces();
      await localStorageService.createCollection({
        name: 'Persistent Collection',
        workspaceId: workspaces[0].id,
      });

      // Verify data was saved to localStorage
      const saved = mockLocalStorage.getItem('apiforge-collections');
      expect(saved).toBeTruthy();

      const parsed = JSON.parse(saved!);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].name).toBe('Persistent Collection');
    });

    it('should handle localStorage errors gracefully', async () => {
      const { localStorageService } = await import('../client/src/lib/local-storage-service');
      const workspaces = await localStorageService.getWorkspaces();

      // Mock setItem to throw error only for collections (after service is initialized)
      const originalSetItem = mockLocalStorage.setItem;
      mockLocalStorage.setItem = (key: string, value: string) => {
        if (key === 'apiforge-collections') {
          throw new Error('Quota exceeded');
        }
        return originalSetItem(key, value);
      };

      await expect(
        localStorageService.createCollection({
          name: 'Test',
          workspaceId: workspaces[0].id,
        })
      ).rejects.toThrow();

      // Restore original
      mockLocalStorage.setItem = originalSetItem;
    });
  });
});
