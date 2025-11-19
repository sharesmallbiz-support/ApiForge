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
  "/import", // OpenAPI spec parsing requires server
];

function shouldUseServer(url: string): boolean {
  return SERVER_ONLY_ROUTES.some(route => url.includes(route));
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Use localStorage for CRUD operations, server for HTTP execution
  if (shouldUseServer(url)) {
    const res = await fetch(url, {
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
      res = await fetch(url, {
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
