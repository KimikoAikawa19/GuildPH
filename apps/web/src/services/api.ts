const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";

export async function apiRequest<T>(
  path: string,
  token: string | undefined,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const error = body?.error;
    throw new Error(error?.message ?? "The request could not be completed.");
  }
  return body.data as T;
}
