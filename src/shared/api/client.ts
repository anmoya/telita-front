export type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ApiRequestOptions = {
  method?: ApiMethod;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

export class ApiClientError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly payload?: unknown;

  constructor(message: string, status: number, code?: string, payload?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.payload = payload;
  }
}

export function createApiClient(baseUrl: string, accessToken: string) {
  async function request<TResponse>(path: string, options: ApiRequestOptions = {}): Promise<TResponse> {
    const url = path.startsWith("http") ? path : `${baseUrl}${path}`;
    const method = options.method ?? "GET";

    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      ...(options.headers ?? {})
    };

    const init: RequestInit = {
      method,
      headers,
      signal: options.signal
    };

    if (options.body !== undefined) {
      headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
      init.body = headers["Content-Type"] === "application/json" ? JSON.stringify(options.body) : String(options.body);
    }

    const response = await fetch(url, init);

    let payload: unknown = null;
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      payload = await response.json().catch(() => null);
    } else {
      payload = await response.text().catch(() => null);
    }

    if (!response.ok) {
      const message =
        typeof payload === "object" && payload !== null && "message" in payload
          ? String((payload as { message?: unknown }).message ?? `HTTP ${response.status}`)
          : `HTTP ${response.status}`;
      const code =
        typeof payload === "object" && payload !== null && "code" in payload
          ? String((payload as { code?: unknown }).code ?? "")
          : undefined;
      throw new ApiClientError(message, response.status, code, payload);
    }

    return payload as TResponse;
  }

  return {
    get: <TResponse>(path: string, options?: Omit<ApiRequestOptions, "method" | "body">) =>
      request<TResponse>(path, { ...(options ?? {}), method: "GET" }),
    post: <TResponse>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, "method" | "body">) =>
      request<TResponse>(path, { ...(options ?? {}), method: "POST", body }),
    put: <TResponse>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, "method" | "body">) =>
      request<TResponse>(path, { ...(options ?? {}), method: "PUT", body }),
    patch: <TResponse>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, "method" | "body">) =>
      request<TResponse>(path, { ...(options ?? {}), method: "PATCH", body }),
    delete: <TResponse>(path: string, options?: Omit<ApiRequestOptions, "method" | "body">) =>
      request<TResponse>(path, { ...(options ?? {}), method: "DELETE" })
  };
}
