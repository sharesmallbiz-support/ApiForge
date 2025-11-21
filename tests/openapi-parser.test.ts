import { describe, it, expect, vi } from "vitest";
import { fetchAndParseOpenAPI } from "../server/openapi-parser";

// Mock fetch
global.fetch = vi.fn();

describe("OpenAPI Parser", () => {
  const mockSpec = {
    openapi: "3.0.0",
    info: {
      title: "Test API",
      description: "A test API",
      version: "1.0.0",
    },
    servers: [
      {
        url: "https://api.example.com/v1",
        description: "Production server",
      },
    ],
    paths: {
      "/users": {
        get: {
          summary: "List users",
          parameters: [
            {
              name: "page",
              in: "query",
              required: false,
              schema: { type: "integer" },
            },
          ],
          responses: {
            "200": { description: "OK" },
          },
        },
        post: {
          summary: "Create user",
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    email: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Created" },
          },
        },
      },
      "/users/{id}": {
        get: {
          summary: "Get user",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": { description: "OK" },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
        },
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "X-API-Key",
        },
      },
    },
  };

  it("should parse basic info correctly", async () => {
    const result = await fetchAndParseOpenAPI(undefined, mockSpec);

    expect(result.title).toBe("Test API");
    expect(result.description).toBe("A test API");
    expect(result.baseUrl).toBe("https://api.example.com/v1");
  });

  it("should parse requests correctly", async () => {
    const result = await fetchAndParseOpenAPI(undefined, mockSpec);

    expect(result.requests).toHaveLength(3);

    const listUsers = result.requests.find((r) => r.method === "GET" && r.path === "/users");
    expect(listUsers).toBeDefined();
    expect(listUsers?.name).toBe("List users");
    expect(listUsers?.params).toHaveLength(1);
    expect(listUsers?.params[0].key).toBe("page");

    const createUser = result.requests.find((r) => r.method === "POST" && r.path === "/users");
    expect(createUser).toBeDefined();
    expect(createUser?.body?.type).toBe("json");
    const bodyContent = JSON.parse(createUser?.body?.content || "{}");
    expect(bodyContent).toHaveProperty("name");
    expect(bodyContent).toHaveProperty("email");
  });

  it("should parse security schemes into environment variables", async () => {
    const result = await fetchAndParseOpenAPI(undefined, mockSpec);

    const bearerToken = result.environmentVariables.find((v) => v.key === "bearerToken");
    expect(bearerToken).toBeDefined();
    expect(bearerToken?.scope).toBe("collection");

    const apiKey = result.environmentVariables.find((v) => v.key === "apiKey"); // Default name if not provided in scheme name property? No, scheme.name is X-API-Key, but var name logic uses scheme.name or "apiKey"
    // Wait, logic is: const varName = scheme.name || "apiKey";
    // In mockSpec, scheme.name is "X-API-Key". So varName should be "X-API-Key".
    // Let's check the implementation again.
    // if (scheme.type === "apiKey") { const varName = scheme.name || "apiKey"; ... }
    // In mockSpec: name: "X-API-Key". So varName is "X-API-Key".
    
    const apiKeyVar = result.environmentVariables.find((v) => v.key === "X-API-Key");
    expect(apiKeyVar).toBeDefined();

    const authHeader = result.environmentHeaders.find((h) => h.key === "Authorization");
    expect(authHeader).toBeDefined();
    expect(authHeader?.value).toBe("Bearer {{bearerToken}}");

    const apiKeyHeader = result.environmentHeaders.find((h) => h.key === "X-API-Key");
    expect(apiKeyHeader).toBeDefined();
    expect(apiKeyHeader?.value).toBe("{{X-API-Key}}");
  });

  it("should fetch spec from URL", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockSpec,
    });

    const result = await fetchAndParseOpenAPI("https://example.com/openapi.json");

    expect(global.fetch).toHaveBeenCalledWith("https://example.com/openapi.json");
    expect(result.title).toBe("Test API");
  });

  it("should handle fetch errors", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      statusText: "Not Found",
    });

    await expect(fetchAndParseOpenAPI("https://example.com/404")).rejects.toThrow(
      "Failed to fetch OpenAPI spec: Not Found"
    );
  });

  it("should promote common parameters to environment variables", async () => {
    const specWithCommonParams = {
      ...mockSpec,
      paths: {
        "/p1": { get: { parameters: [{ name: "tenantId", in: "query" }] } },
        "/p2": { get: { parameters: [{ name: "tenantId", in: "query" }] } },
        "/p3": { get: { parameters: [{ name: "tenantId", in: "query" }] } },
      },
    };

    const result = await fetchAndParseOpenAPI(undefined, specWithCommonParams);
    
    const tenantIdVar = result.environmentVariables.find(v => v.key === "tenantId");
    expect(tenantIdVar).toBeDefined();
  });

  it("should handle oneOf schema in request body", async () => {
    const specWithOneOf = {
      ...mockSpec,
      paths: {
        "/polymorphic": {
          post: {
            requestBody: {
              content: {
                "application/json": {
                  schema: {
                    oneOf: [
                      {
                        type: "object",
                        properties: {
                          type: { type: "string", enum: ["a"] },
                          a: { type: "string" },
                        },
                      },
                      {
                        type: "object",
                        properties: {
                          type: { type: "string", enum: ["b"] },
                          b: { type: "number" },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      },
    };

    const result = await fetchAndParseOpenAPI(undefined, specWithOneOf);
    const request = result.requests.find((r) => r.path === "/polymorphic");
    expect(request).toBeDefined();
    expect(request?.body?.type).toBe("json");

    const body = JSON.parse(request?.body?.content || "{}");
    // Should pick the first option by default
    expect(body).toHaveProperty("type", "a");
    expect(body).toHaveProperty("a", "string");
  });

  it("should handle nested objects in schema", async () => {
    const specWithNested = {
      ...mockSpec,
      paths: {
        "/nested": {
          post: {
            requestBody: {
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      user: {
                        type: "object",
                        properties: {
                          address: {
                            type: "object",
                            properties: {
                              city: { type: "string", example: "New York" },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    };

    const result = await fetchAndParseOpenAPI(undefined, specWithNested);
    const request = result.requests.find((r) => r.path === "/nested");
    const body = JSON.parse(request?.body?.content || "{}");

    expect(body).toHaveProperty("user");
    expect(body.user).toHaveProperty("address");
    expect(body.user.address).toHaveProperty("city", "New York");
  });

  it("should parse x-hosted-run-url and x-last-hosted-run extensions", async () => {
    const specWithExtensions = {
      openapi: "3.0.0",
      info: {
        title: "Extended API",
        version: "1.0.0",
      },
      paths: {
        "/extended": {
          get: {
            summary: "Extended Operation",
            "x-hosted-run-url": "https://api.example.com/runs/123",
            "x-last-hosted-run": "2023-01-01T12:00:00Z",
            responses: {
              "200": {
                description: "OK",
              },
            },
          },
        },
      },
    };

    const result = await fetchAndParseOpenAPI(undefined, specWithExtensions);
    expect(result.requests).toHaveLength(1);
    expect(result.requests[0].hostedRunUrl).toBe("https://api.example.com/runs/123");
    expect(result.requests[0].lastHostedRun).toBe("2023-01-01T12:00:00Z");
  });
});
