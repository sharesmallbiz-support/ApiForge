import type { InsertCollection, InsertFolder, InsertRequest, InsertEnvironment } from "@shared/schema";

export interface SampleData {
  collection: InsertCollection;
  folders: Array<InsertFolder & { requests: Array<Omit<InsertRequest, "folderId">> }>;
  environment: InsertEnvironment;
}

export function createSampleData(workspaceId: string): SampleData {
  return {
    collection: {
      name: "🚀 Sample API Collection",
      description: "Example requests using JSONPlaceholder - a free fake REST API for testing",
      workspaceId,
    },
    folders: [
      {
        name: "👥 Users",
        collectionId: "", // Will be filled when creating
        requests: [
          {
            name: "Get All Users",
            method: "GET",
            url: "{{baseUrl}}/users",
            headers: [],
            params: [],
          },
          {
            name: "Get User by ID",
            method: "GET",
            url: "{{baseUrl}}/users/1",
            headers: [],
            params: [],
          },
          {
            name: "Create User",
            method: "POST",
            url: "{{baseUrl}}/users",
            headers: [
              { key: "Content-Type", value: "application/json", enabled: true },
            ],
            params: [],
            body: {
              type: "json",
              content: JSON.stringify(
                {
                  name: "John Doe",
                  username: "johndoe",
                  email: "john.doe@example.com",
                  phone: "1-770-736-8031",
                  website: "johndoe.com",
                },
                null,
                2
              ),
            },
            script: `// Extract the created user ID
const response = pm.response.json();
if (response.id) {
  pm.environment.set("userId", response.id.toString());
  console.log("Created user with ID:", response.id);
}`,
          },
          {
            name: "Update User",
            method: "PUT",
            url: "{{baseUrl}}/users/{{userId}}",
            headers: [
              { key: "Content-Type", value: "application/json", enabled: true },
            ],
            params: [],
            body: {
              type: "json",
              content: JSON.stringify(
                {
                  name: "Jane Doe",
                  username: "janedoe",
                  email: "jane.doe@example.com",
                },
                null,
                2
              ),
            },
          },
          {
            name: "Delete User",
            method: "DELETE",
            url: "{{baseUrl}}/users/{{userId}}",
            headers: [],
            params: [],
          },
        ],
      },
      {
        name: "📝 Posts",
        collectionId: "", // Will be filled when creating
        requests: [
          {
            name: "Get All Posts",
            method: "GET",
            url: "{{baseUrl}}/posts",
            headers: [],
            params: [
              { key: "_limit", value: "10", enabled: true },
            ],
          },
          {
            name: "Get Posts by User",
            method: "GET",
            url: "{{baseUrl}}/posts",
            headers: [],
            params: [
              { key: "userId", value: "{{userId}}", enabled: true },
            ],
          },
          {
            name: "Create Post",
            method: "POST",
            url: "{{baseUrl}}/posts",
            headers: [
              { key: "Content-Type", value: "application/json", enabled: true },
            ],
            params: [],
            body: {
              type: "json",
              content: JSON.stringify(
                {
                  title: "My First Post",
                  body: "This is the content of my amazing post!",
                  userId: 1,
                },
                null,
                2
              ),
            },
            script: `// Save the post ID for later use
const response = pm.response.json();
if (response.id) {
  pm.environment.set("postId", response.id.toString());
  console.log("Post created with ID:", response.id);
}`,
          },
        ],
      },
      {
        name: "💬 Comments",
        collectionId: "", // Will be filled when creating
        requests: [
          {
            name: "Get Comments for Post",
            method: "GET",
            url: "{{baseUrl}}/posts/{{postId}}/comments",
            headers: [],
            params: [],
          },
          {
            name: "Search Comments",
            method: "GET",
            url: "{{baseUrl}}/comments",
            headers: [],
            params: [
              { key: "postId", value: "1", enabled: true },
              { key: "_limit", value: "5", enabled: false },
            ],
          },
        ],
      },
    ],
    environment: {
      name: "JSONPlaceholder Demo",
      variables: [
        {
          key: "baseUrl",
          value: "https://jsonplaceholder.typicode.com",
          enabled: true,
          scope: "collection",
          scopeId: "", // Will be filled when creating
        },
        {
          key: "userId",
          value: "1",
          enabled: true,
          scope: "workspace",
          scopeId: workspaceId,
        },
        {
          key: "postId",
          value: "1",
          enabled: true,
          scope: "workspace",
          scopeId: workspaceId,
        },
      ],
      headers: [
        {
          key: "Accept",
          value: "application/json",
          enabled: true,
        },
      ],
    },
  };
}
