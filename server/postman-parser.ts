import type { EnvironmentVariable } from "@shared/schema";

// Postman Collection Types
interface PostmanHeader {
  key: string;
  value: string;
  disabled?: boolean;
  type?: string;
}

interface PostmanQueryParam {
  key: string;
  value: string;
  disabled?: boolean;
}

interface PostmanUrl {
  raw?: string;
  host?: string | string[];
  path?: string | string[];
  query?: PostmanQueryParam[];
}

interface PostmanBody {
  mode?: string;
  raw?: string;
  options?: {
    raw?: {
      language?: string;
    };
  };
}

interface PostmanRequest {
  method: string;
  header?: PostmanHeader[];
  url?: string | PostmanUrl;
  body?: PostmanBody;
}

interface PostmanItem {
  name: string;
  request?: PostmanRequest;
  item?: PostmanItem[];
  response?: any[];
}

interface PostmanCollection {
  info: {
    name: string;
    _postman_id?: string;
    description?: string;
    schema?: string;
  };
  item: PostmanItem[];
}

// Postman Environment Types
interface PostmanEnvironmentVariable {
  key: string;
  value: string;
  type?: string;
  enabled?: boolean;
}

interface PostmanEnvironment {
  id?: string;
  name: string;
  values: PostmanEnvironmentVariable[];
  _postman_variable_scope?: string;
  _postman_exported_at?: string;
}

export interface ParsedPostmanFolder {
  name: string;
  folders: ParsedPostmanFolder[];
  requests: Array<{
    name: string;
    method: string;
    url: string;
    headers: Array<{ key: string; value: string; enabled: boolean }>;
    params: Array<{ key: string; value: string; enabled: boolean }>;
    body?: { type: string; content: string };
  }>;
}

export interface ParsedPostmanCollection {
  name: string;
  description: string;
  folders: ParsedPostmanFolder[];
}

export interface ParsedPostmanEnvironment {
  name: string;
  variables: EnvironmentVariable[];
}

/**
 * Parse Postman Collection v2.1 format
 */
export function parsePostmanCollection(collectionData: any): ParsedPostmanCollection {
  try {
    const collection: PostmanCollection = collectionData;

    if (!collection.info || !collection.item) {
      throw new Error("Invalid Postman collection format");
    }

    const name = collection.info.name || "Imported Postman Collection";
    const description = collection.info.description || `Imported from Postman`;

    const folders: ParsedPostmanFolder[] = [];

    // Process top-level items (folders and requests)
    for (const item of collection.item) {
      if (item.item) {
        // It's a folder with nested items
        const folder = processFolder(item);
        folders.push(folder);
      } else if (item.request) {
        // It's a standalone request - put in "General" folder
        let generalFolder = folders.find(f => f.name === "General");
        if (!generalFolder) {
          generalFolder = { name: "General", folders: [], requests: [] };
          folders.push(generalFolder);
        }
        const request = processRequest(item);
        if (request) {
          generalFolder.requests.push(request);
        }
      }
    }

    return {
      name,
      description,
      folders,
    };
  } catch (error) {
    console.error("Failed to parse Postman collection:", error);
    throw new Error(`Failed to parse Postman collection: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function processFolder(folderItem: PostmanItem): ParsedPostmanFolder {
  const folder: ParsedPostmanFolder = {
    name: folderItem.name,
    folders: [],
    requests: [],
  };

  if (folderItem.item) {
    for (const item of folderItem.item) {
      if (item.item) {
        // Nested folder - preserve the structure
        const nestedFolder = processFolder(item);
        folder.folders.push(nestedFolder);
      } else if (item.request) {
        const request = processRequest(item);
        if (request) {
          folder.requests.push(request);
        }
      }
    }
  }

  return folder;
}

function processRequest(item: PostmanItem) {
  if (!item.request) return null;

  const request = item.request;
  const name = item.name;
  const method = request.method.toUpperCase();

  // Parse URL
  let url = "";
  let params: Array<{ key: string; value: string; enabled: boolean }> = [];

  if (typeof request.url === "string") {
    url = request.url;
  } else if (request.url) {
    // Construct URL from parts
    const urlObj = request.url;

    // Build host
    let host = "";
    if (Array.isArray(urlObj.host)) {
      host = urlObj.host.join(".");
    } else if (typeof urlObj.host === "string") {
      host = urlObj.host;
    }

    // Build path
    let path = "";
    if (Array.isArray(urlObj.path)) {
      path = "/" + urlObj.path.join("/");
    } else if (typeof urlObj.path === "string") {
      path = urlObj.path.startsWith("/") ? urlObj.path : "/" + urlObj.path;
    }

    // Use raw if available, otherwise construct
    if (urlObj.raw) {
      url = urlObj.raw;
    } else if (host) {
      // Detect protocol
      const protocol = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https";
      url = `${protocol}://${host}${path}`;
    }

    // Parse query parameters
    if (urlObj.query) {
      params = urlObj.query.map(q => ({
        key: q.key,
        value: q.value,
        enabled: !q.disabled,
      }));
    }
  }

  // Parse headers
  const headers: Array<{ key: string; value: string; enabled: boolean }> = [];
  if (request.header) {
    for (const header of request.header) {
      headers.push({
        key: header.key,
        value: header.value,
        enabled: !header.disabled,
      });
    }
  }

  // Parse body
  let body: { type: string; content: string } | undefined;
  if (request.body && request.body.mode) {
    if (request.body.mode === "raw") {
      let bodyType: "json" | "form" | "raw" = "raw";

      // Try to detect JSON
      if (request.body.options?.raw?.language === "json") {
        bodyType = "json";
      } else if (request.body.raw) {
        try {
          JSON.parse(request.body.raw);
          bodyType = "json";
        } catch {
          bodyType = "raw";
        }
      }

      body = {
        type: bodyType,
        content: request.body.raw || "",
      };
    } else if (request.body.mode === "formdata" || request.body.mode === "urlencoded") {
      body = {
        type: "form",
        content: request.body.raw || "",
      };
    }
  }

  return {
    name,
    method,
    url,
    headers,
    params,
    body,
  };
}

/**
 * Parse Postman Environment format
 */
export function parsePostmanEnvironment(environmentData: any): ParsedPostmanEnvironment {
  try {
    const environment: PostmanEnvironment = environmentData;

    if (!environment.name || !environment.values) {
      throw new Error("Invalid Postman environment format");
    }

    const name = environment.name;
    const variables: EnvironmentVariable[] = [];

    for (const variable of environment.values) {
      variables.push({
        key: variable.key,
        value: variable.value,
        enabled: variable.enabled !== false,
        scope: "global",
      });
    }

    return {
      name,
      variables,
    };
  } catch (error) {
    console.error("Failed to parse Postman environment:", error);
    throw new Error(`Failed to parse Postman environment: ${error instanceof Error ? error.message : String(error)}`);
  }
}
