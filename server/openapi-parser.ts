import type { InsertFolder, EnvironmentVariable } from "@shared/schema";

interface OpenAPIPath {
  [key: string]: {
    [method: string]: {
      summary?: string;
      description?: string;
      parameters?: Array<{
        name: string;
        in: string;
        required?: boolean;
        schema?: { type: string };
      }>;
      requestBody?: {
        content?: {
          [contentType: string]: {
            schema?: any;
          };
        };
      };
      security?: Array<Record<string, string[]>>;
    };
  };
}

interface OpenAPISpec {
  openapi?: string;
  swagger?: string;
  info?: {
    title?: string;
    description?: string;
  };
  servers?: Array<{
    url: string;
    description?: string;
  }>;
  paths?: OpenAPIPath;
  components?: {
    securitySchemes?: Record<string, {
      type: string;
      scheme?: string;
      bearerFormat?: string;
      in?: string;
      name?: string;
    }>;
  };
  security?: Array<Record<string, string[]>>;
}

export interface ParsedOpenAPI {
  title: string;
  description: string;
  baseUrl: string;
  requests: Array<{
    name: string;
    method: string;
    path: string;
    headers: Array<{ key: string; value: string; enabled: boolean }>;
    params: Array<{ key: string; value: string; enabled: boolean }>;
    body?: { type: string; content: string };
    hostedRunUrl?: string;
    lastHostedRun?: string;
  }>;
  environmentVariables: EnvironmentVariable[];
  environmentHeaders: Array<{ key: string; value: string; enabled: boolean }>;
}

export async function fetchAndParseOpenAPI(url?: string, specData?: any): Promise<ParsedOpenAPI> {
  try {
    let spec: OpenAPISpec;

    if (specData) {
      // Use provided spec data
      spec = specData;
    } else if (url) {
      // Fetch the OpenAPI spec from URL
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch OpenAPI spec: ${response.statusText}`);
      }
      spec = await response.json();
    } else {
      throw new Error("Either url or spec data must be provided");
    }

    // Extract basic info
    const title = spec.info?.title || "Imported API";
    const description = spec.info?.description || `Imported from ${url}`;
    const baseUrl = spec.servers?.[0]?.url || "";

    // Extract environment variables and headers
    const environmentVariables: EnvironmentVariable[] = [];
    const environmentHeaders: Array<{ key: string; value: string; enabled: boolean }> = [];

    // Add baseUrl as a variable
    if (baseUrl) {
      environmentVariables.push({
        key: "baseUrl",
        value: baseUrl,
        enabled: true,
        scope: "collection",
      });
    }

    // Extract security schemes and create environment variables
    const securitySchemes = spec.components?.securitySchemes || {};
    for (const [schemeName, scheme] of Object.entries(securitySchemes)) {
      if (scheme.type === "http" && scheme.scheme === "bearer") {
        // Bearer token authentication
        environmentVariables.push({
          key: "bearerToken",
          value: "",
          enabled: true,
          scope: "collection",
        });
        environmentHeaders.push({
          key: "Authorization",
          value: "Bearer {{bearerToken}}",
          enabled: true,
        });
      } else if (scheme.type === "apiKey") {
        // API Key authentication
        const varName = scheme.name || "apiKey";
        environmentVariables.push({
          key: varName,
          value: "",
          enabled: true,
          scope: "collection",
        });

        if (scheme.in === "header") {
          environmentHeaders.push({
            key: scheme.name || "X-API-Key",
            value: `{{${varName}}}`,
            enabled: true,
          });
        }
      } else if (scheme.type === "http" && scheme.scheme === "basic") {
        // Basic authentication
        environmentVariables.push({
          key: "username",
          value: "",
          enabled: true,
          scope: "collection",
        });
        environmentVariables.push({
          key: "password",
          value: "",
          enabled: true,
          scope: "collection",
        });
      } else if (scheme.type === "oauth2") {
        // OAuth2 authentication
        environmentVariables.push({
          key: "accessToken",
          value: "",
          enabled: true,
          scope: "collection",
        });
        environmentHeaders.push({
          key: "Authorization",
          value: "Bearer {{accessToken}}",
          enabled: true,
        });
      }
    }

    // Collect common path and query parameters to suggest as variables
    const commonParams = new Map<string, { count: number; in: string }>();

    // Parse paths
    const requests: ParsedOpenAPI["requests"] = [];

    if (spec.paths) {
      for (const [path, pathItem] of Object.entries(spec.paths)) {
        for (const [method, operation] of Object.entries(pathItem)) {
          // Skip non-HTTP methods
          const httpMethods = ["get", "post", "put", "delete", "patch"];
          if (!httpMethods.includes(method.toLowerCase())) continue;

          const requestName = operation.summary || operation.description || `${method.toUpperCase()} ${path}`;

          // Extract parameters
          const params: Array<{ key: string; value: string; enabled: boolean }> = [];
          const headers: Array<{ key: string; value: string; enabled: boolean }> = [];

          if (operation.parameters) {
            for (const param of operation.parameters) {
              // Track common parameters
              const paramKey = `${param.in}:${param.name}`;
              const existing = commonParams.get(paramKey);
              if (existing) {
                existing.count++;
              } else {
                commonParams.set(paramKey, { count: 1, in: param.in });
              }

              if (param.in === "query") {
                params.push({
                  key: param.name,
                  value: "",
                  enabled: param.required || false,
                });
              } else if (param.in === "header") {
                headers.push({
                  key: param.name,
                  value: "",
                  enabled: param.required || false,
                });
              }
            }
          }

          // Extract request body
          let body: { type: string; content: string } | undefined;
          if (operation.requestBody) {
            const content = operation.requestBody.content;
            if (content) {
              // Check for JSON content type
              const jsonContent = content["application/json"];
              if (jsonContent && jsonContent.schema) {
                // Generate example from schema
                const example = generateExampleFromSchema(jsonContent.schema);
                body = {
                  type: "json",
                  content: JSON.stringify(example, null, 2),
                };
              }
            }
          }

          // Check for x-hosted-run-url extension
          const hostedRunUrl = (operation as any)["x-hosted-run-url"];
          const lastHostedRun = (operation as any)["x-last-hosted-run"];

          requests.push({
            name: requestName,
            method: method.toUpperCase(),
            path,
            headers,
            params,
            body,
            hostedRunUrl,
            lastHostedRun,
          });
        }
      }
    }

    // Add common parameters as environment variables (if used in 3+ endpoints)
    for (const [paramKey, info] of Array.from(commonParams.entries())) {
      if (info.count >= 3) {
        const paramName = paramKey.split(":")[1];
        // Only add if not already in the list
        if (!environmentVariables.some(v => v.key === paramName)) {
          environmentVariables.push({
            key: paramName,
            value: "",
            enabled: true,
            scope: "collection",
          });
        }
      }
    }

    return {
      title,
      description,
      baseUrl,
      requests,
      environmentVariables,
      environmentHeaders,
    };
  } catch (error) {
    console.error("Failed to parse OpenAPI spec:", error);
    throw new Error(`Failed to parse OpenAPI spec: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function generateExampleFromSchema(schema: any): any {
  if (!schema) return {};

  // If there's an example, use it
  if (schema.example) return schema.example;

  // Handle oneOf/anyOf/allOf
  if (schema.oneOf && schema.oneOf.length > 0) {
    return generateExampleFromSchema(schema.oneOf[0]);
  }
  if (schema.anyOf && schema.anyOf.length > 0) {
    return generateExampleFromSchema(schema.anyOf[0]);
  }
  if (schema.allOf && schema.allOf.length > 0) {
    let result = {};
    for (const subSchema of schema.allOf) {
      result = { ...result, ...generateExampleFromSchema(subSchema) };
    }
    return result;
  }

  // Handle different schema types
  if (schema.type === "object") {
    const result: any = {};
    if (schema.properties) {
      for (const [key, prop] of Object.entries(schema.properties)) {
        result[key] = generateExampleFromSchema(prop);
      }
    }
    return result;
  } else if (schema.type === "array") {
    return schema.items ? [generateExampleFromSchema(schema.items)] : [];
  } else if (schema.type === "string") {
    return schema.enum ? schema.enum[0] : "string";
  } else if (schema.type === "number" || schema.type === "integer") {
    return 0;
  } else if (schema.type === "boolean") {
    return false;
  }

  return {};
}
