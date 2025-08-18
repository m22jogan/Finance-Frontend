// client/src/lib/queryClient.ts
import { QueryClient, QueryFunction } from "@tanstack/react-query";

/**
 * Throws an error if the fetch response is not OK (status outside 200-299)
 */
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

/**
 * Generic API request helper
 * - Supports JSON and FormData
 * - Automatically sets X-User-Id header if available
 * - Handles credentials
 */
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown,
  userId?: string // <-- now aligned with your CSV upload
): Promise<Response> {
  const apiUrl = import.meta.env.VITE_API_URL;
  const fullUrl = `${apiUrl}${url}`;

  const storedUserId = localStorage.getItem("user_id_placeholder");

  // Base headers
  const headers: HeadersInit = {};
  if (userId ?? storedUserId) {
    headers["X-User-Id"] = userId ?? storedUserId!;
  }

  const options: RequestInit = {
    method,
    headers,
    credentials: "include",
  };

  if (data instanceof FormData) {
    // FormData: let browser set Content-Type
    options.body = data;
  } else if (data) {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(data);
  }

  const res = await fetch(fullUrl, options);
  await throwIfResNotOk(res);
  return res;
}

/**
 * Default query function generator for react-query
 */
type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const apiUrl = import.meta.env.VITE_API_URL;
    const fullUrl = `${apiUrl}${queryKey.join("/") as string}`;

    const storedUserId = localStorage.getItem("user_id_placeholder");
    const headers: HeadersInit = {};
    if (storedUserId) {
      headers["X-User-Id"] = storedUserId;
    }

    const res = await fetch(fullUrl, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

/**
 * React Query Client
 */
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
