// src/lib/queryClient.ts (No changes needed)
import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown
): Promise<Response> {
  const apiUrl = import.meta.env.VITE_API_URL;
  const fullUrl = `${apiUrl}${url}`;

  // Get the token from local storage
  const token = localStorage.getItem("auth_token");

  const headers: HeadersInit = {};
  // If the token exists, add the Authorization header
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const options: RequestInit = {
    method,
    headers,
    credentials: "include",
  };

  if (data instanceof FormData) {
    options.body = data;
  } else if (data) {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(data);
  }

  const res = await fetch(fullUrl, options);
  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const apiUrl = import.meta.env.VITE_API_URL;
    const fullUrl = `${apiUrl}${queryKey.join("/") as string}`;

    const token = localStorage.getItem("auth_token");
    const headers: HeadersInit = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
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