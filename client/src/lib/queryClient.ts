// client/src/lib/queryClient.ts
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
  data?: unknown | undefined,
  // Add an optional userId parameter for explicit passing if needed,
  // though typically it would come from an auth context.
  userId?: string 
): Promise<Response> {
  const apiUrl = import.meta.env.VITE_API_URL;
  const fullUrl = `${apiUrl}${url}`;

  // This is where you'd typically get the user ID from your authentication state
  // For now, let's use a placeholder or a header.
  // In a real app, this would come from a global auth context or token.
  const tempUserId = localStorage.getItem('user_id_placeholder') || 'generated-user-id'; 
  // For testing, you might set this in local storage, or get it from an actual auth token.

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    // Include the X-User-Id header for every request
    "X-User-Id": userId || tempUserId, 
  };

  const options: RequestInit = {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include", // Important for cookies/credentials if your auth uses them
  };
  
  // For FormData (e.g., CSV upload), Content-Type header should not be set manually
  // as the browser sets it automatically with the correct boundary.
  if (data instanceof FormData) {
    delete headers['Content-Type'];
    options.body = data; // Assign FormData directly
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

    // Ensure X-User-Id is passed for GET requests handled by default queryFn
    const tempUserId = localStorage.getItem('user_id_placeholder') || 'generated-user-id';
    const headers: HeadersInit = {
      "X-User-Id": tempUserId,
    };

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