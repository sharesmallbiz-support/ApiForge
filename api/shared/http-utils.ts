// Shared utilities for Azure Functions
// These are simplified versions adapted from server logic

export interface HttpExecutionResult {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  time: number;
  size: number;
}

export async function executeHttpRequest(
  method: string,
  url: string,
  headers: Record<string, string>,
  body?: string
): Promise<HttpExecutionResult> {
  const startTime = Date.now();

  try {
    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    // Add body for POST, PUT, PATCH
    if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
      fetchOptions.body = body;
    }

    const response = await fetch(url, fetchOptions);

    // Get response body
    const responseText = await response.text();
    const endTime = Date.now();

    // Extract response headers
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    return {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: responseText,
      time: endTime - startTime,
      size: Buffer.byteLength(responseText, "utf8"),
    };
  } catch (error: any) {
    const endTime = Date.now();

    const errorBody = JSON.stringify({
      error: error.message || "Request failed",
      type: error.name || "Error",
    });

    return {
      status: 0,
      statusText: error.message || "Request failed",
      headers: {},
      body: errorBody,
      time: endTime - startTime,
      size: Buffer.byteLength(errorBody, "utf8"),
    };
  }
}

export function substituteVariables(
  text: string,
  variables: Record<string, string>
): string {
  if (!text) return text;

  const variablePattern = /\{\{([^}]+)\}\}/g;
  return text.replace(variablePattern, (match, variableName) => {
    const key = variableName.trim();
    return variables[key] !== undefined ? variables[key] : match;
  });
}

export function buildUrlWithParams(url: string, params: Array<{ key: string; value: string; enabled: boolean }>): string {
  try {
    const urlObj = new URL(url);
    params
      .filter(p => p.enabled)
      .forEach(p => urlObj.searchParams.append(p.key, p.value));
    return urlObj.toString();
  } catch {
    return url;
  }
}
