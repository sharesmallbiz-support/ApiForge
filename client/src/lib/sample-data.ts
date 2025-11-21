import type { InsertCollection, InsertFolder, InsertRequest, InsertEnvironment } from "@shared/schema";

export interface SampleData {
  collection: InsertCollection;
  folders: Array<InsertFolder & { requests: Array<Omit<InsertRequest, "folderId">> }>;
  environment: InsertEnvironment;
}

export function createSampleData(workspaceId: string): SampleData {
  return {
    collection: {
      name: "😂 Jokes API Collection",
      description: "Example requests using JokeAPI - get random jokes from different categories",
      workspaceId,
    },
    folders: [
      {
        name: "🎭 Random Jokes",
        collectionId: "", // Will be filled when creating
        requests: [
          {
            name: "Any Random Joke",
            method: "GET",
            url: "{{baseUrl}}/joke/Any?safe-mode",
            headers: [],
            params: [],
            lastHostedRun: new Date().toISOString(),
            hostedRunResult: "Success",
            hostedRunUrl: "https://portal.azure.com/#trace/sample-trace-id",
          },
          {
            name: "Programming Joke",
            method: "GET",
            url: "{{baseUrl}}/joke/Programming",
            headers: [],
            params: [
              { key: "safe-mode", value: "", enabled: true },
            ],
          },
          {
            name: "Pun Joke",
            method: "GET",
            url: "{{baseUrl}}/joke/Pun",
            headers: [],
            params: [
              { key: "safe-mode", value: "", enabled: true },
            ],
          },
          {
            name: "Miscellaneous Joke",
            method: "GET",
            url: "{{baseUrl}}/joke/Miscellaneous",
            headers: [],
            params: [
              { key: "safe-mode", value: "", enabled: true },
            ],
          },
        ],
      },
      {
        name: "🔍 Filtered Jokes",
        collectionId: "", // Will be filled when creating
        requests: [
          {
            name: "Single-part Joke",
            method: "GET",
            url: "{{baseUrl}}/joke/Any",
            headers: [],
            params: [
              { key: "type", value: "single", enabled: true },
              { key: "safe-mode", value: "", enabled: true },
            ],
          },
          {
            name: "Two-part Joke",
            method: "GET",
            url: "{{baseUrl}}/joke/Any",
            headers: [],
            params: [
              { key: "type", value: "twopart", enabled: true },
              { key: "safe-mode", value: "", enabled: true },
            ],
          },
          {
            name: "Search Jokes",
            method: "GET",
            url: "{{baseUrl}}/joke/Any",
            headers: [],
            params: [
              { key: "contains", value: "debugging", enabled: true },
              { key: "safe-mode", value: "", enabled: true },
            ],
          },
        ],
      },
      {
        name: "📊 API Information",
        collectionId: "", // Will be filled when creating
        requests: [
          {
            name: "Get Categories",
            method: "GET",
            url: "{{baseUrl}}/categories",
            headers: [],
            params: [],
          },
          {
            name: "Get Language Codes",
            method: "GET",
            url: "{{baseUrl}}/languages",
            headers: [],
            params: [],
          },
          {
            name: "Get API Info",
            method: "GET",
            url: "{{baseUrl}}/info",
            headers: [],
            params: [],
          },
        ],
      },
    ],
    environment: {
      name: "Production",
      variables: [
        {
          key: "baseUrl",
          value: "https://v2.jokeapi.dev",
          enabled: true,
          scope: "collection",
          scopeId: "", // Will be filled when creating
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
