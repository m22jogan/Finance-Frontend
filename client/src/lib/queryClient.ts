import { QueryClient, QueryFunction } from "@tanstack/react-query";

/**
 * Throws an error if response is not ok
 */
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
    credentials: "include", // 🔑 cookies sent automatically
  };

  if (data && !(data instanceof FormData)) {
    options.headers = {
      "Content-Type": "application/json",
    };
    options.body = JSON.stringify(data);
  } else if (data instanceof FormData) {
    options.body = data;
  }

  const res = await fetch(fullUrl, options);
  await throwIfResNotOk(res);
  return res;
}

/**
 * React Query query function that handles 401s
 */
type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401 }) =>
  async ({ queryKey }) => {
    const apiUrl = import.meta.env.VITE_API_URL;
    const fullUrl = `${apiUrl}${queryKey.join("/")}`;

    const res = await fetch(fullUrl, {
      credentials: "include",
    });

    if (res.status === 401 && on401 === "returnNull") {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

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
