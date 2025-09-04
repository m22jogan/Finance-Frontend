// src/lib/queryClient.ts
import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

/**
 * Generic API request wrapper using fetch.
 * Cookies are sent automatically with `credentials: "include"`.
 */
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown
): Promise<Response> {
  const apiUrl = import.meta.env.VITE_API_URL;
  const fullUrl = `${apiUrl}${url}`;

  const options: RequestInit = {
    method,
    credentials: "include", // 🔑 Send cookies cross-origin
  };

  // Only set JSON Content-Type if sending JSON
  if (data && !(data instanceof FormData)) {
    options.headers = {
      "Content-Type": "application/json",
    };
    options.body = JSON.stringify(data);
  } else if (data instanceof FormData) {
    options.body = data; // Let browser set multipart/form-data boundary
  }

  const res = await fetch(fullUrl, options);
  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";

/**
 * Creates a query function for React Query that handles 401s.
 * Uses cookies, so no Authorization header needed.
 */
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401 }) =>
  async ({ queryKey }) => {
    const apiUrl = import.meta.env.VITE_API_URL;
    const fullUrl = `${apiUrl}${queryKey.join("/")}`;

    const res = await fetch(fullUrl, {
      credentials: "include", // 🔑 Cookies handle auth
    });

    if (res.status === 401 && on401 === "returnNull") {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

// React Query client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      staleTime: Infinity,
      refetchOnWindowFocus: false,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
