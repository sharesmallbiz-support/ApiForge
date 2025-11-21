import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { localStorageRequest } from "./local-storage-adapter";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Routes that MUST use the server (HTTP execution, OpenAPI import, etc.)
const SERVER_ONLY_ROUTES = [
  "/execute",
  "/history",
  "/import", // OpenAPI and Postman import parsing requires server
  "/import-postman", // Postman collection/environment parsing
];

function shouldUseServer(url: string): boolean {
  return SERVER_ONLY_ROUTES.some(route => url.includes(route));
}

async function fetchWithRetry(url: string, options: RequestInit, retries = 3, backoff = 1000): Promise<Response> {
  try {
    const res = await fetch(url, options);
    // Retry on 503 (Service Unavailable) or 504 (Gateway Timeout) which might happen during cold start
    if ((res.status === 503 || res.status === 504) && retries > 0) {
      await new Promise(r => setTimeout(r, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    return res;
  } catch (err) {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    throw err;
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Use localStorage for CRUD operations, server for HTTP execution
  if (shouldUseServer(url)) {
    const res = await fetchWithRetry(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });
    await throwIfResNotOk(res);
    return res;
  } else {
    // Use localStorage
    const res = await localStorageRequest(method, url, data);
    await throwIfResNotOk(res);
    return res;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey.join("/") as string;

    // Use localStorage for data queries, server for execution/history
    let res: Response;
    if (shouldUseServer(url)) {
      res = await fetchWithRetry(url, {
        credentials: "include",
      });
    } else {
      res = await localStorageRequest("GET", url);
    }

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
