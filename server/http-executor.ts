import type { Request as AppRequest } from "@shared/schema";

export interface HttpExecutionResult {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  time: number;
  size: number;
}

export async function executeHttpRequest(
  request: AppRequest,
  resolvedUrl: string,
  resolvedHeaders: Array<{ key: string; value: string; enabled: boolean }>,
  resolvedParams: Array<{ key: string; value: string; enabled: boolean }>,
  resolvedBody?: string
): Promise<HttpExecutionResult> {
  const startTime = Date.now();

  try {
    // Build URL with query parameters
    const url = new URL(resolvedUrl);
    resolvedParams
      .filter(p => p.enabled)
      .forEach(p => url.searchParams.append(p.key, p.value));

    // Build headers object
    const headers: Record<string, string> = {};
    resolvedHeaders
      .filter(h => h.enabled)
      .forEach(h => headers[h.key] = h.value);

    // Make HTTP request
    const fetchOptions: RequestInit = {
      method: request.method,
      headers,
    };

    // Add body for POST, PUT, PATCH
    if (request.body && (request.method === "POST" || request.method === "PUT" || request.method === "PATCH")) {
      fetchOptions.body = resolvedBody;
    }

    const response = await fetch(url.toString(), fetchOptions);

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

    // Return error as result
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
