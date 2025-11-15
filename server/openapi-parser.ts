import type { InsertRequest } from "@shared/schema";

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
  }>;
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

          requests.push({
            name: requestName,
            method: method.toUpperCase(),
            path,
            headers,
            params,
            body,
          });
        }
      }
    }

    return {
      title,
      description,
      baseUrl,
      requests,
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
