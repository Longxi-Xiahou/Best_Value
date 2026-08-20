const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export class ApiClientError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiClientError";
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const payload = (await response.json()) as ApiResponse<T> & { error?: { message?: string } };

  if (!response.ok || !payload.success) {
    throw new ApiClientError(response.status, payload.error?.message ?? "Request failed");
  }

  return payload.data;
}

export interface HealthStatus { status: string; timestamp: string; }

export const getApiHealth = () => apiFetch<HealthStatus>("/health");
