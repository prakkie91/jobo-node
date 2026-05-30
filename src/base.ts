import {
  JoboError,
  JoboAuthenticationError,
  JoboRateLimitError,
  JoboValidationError,
  JoboServerError,
} from "./errors";

export interface HttpOptions {
  baseUrl: string;
  timeout: number;
  apiKey: string;
  _fetch: typeof globalThis.fetch;
}

const USER_AGENT = "jobo-node/3.0.0";

export function toISOString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

export function stripUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null) {
      result[key] = value;
    }
  }
  return result;
}

async function handleError(response: Response): Promise<never> {
  const status = response.status;
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = await response.text().catch(() => "");
  }

  const detail =
    typeof body === "object" && body !== null && "detail" in body
      ? String((body as Record<string, unknown>).detail)
      : String(body);
  const message = detail ? `HTTP ${status}: ${detail}` : `HTTP ${status}`;
  const opts = { statusCode: status, detail, responseBody: body };

  if (status === 401) throw new JoboAuthenticationError(message, opts);
  if (status === 429) {
    const retryAfter = response.headers.get("Retry-After");
    throw new JoboRateLimitError(message, {
      ...opts,
      retryAfter: retryAfter ? parseInt(retryAfter, 10) : undefined,
    });
  }
  if (status === 400) throw new JoboValidationError(message, opts);
  if (status >= 500) throw new JoboServerError(message, opts);

  throw new JoboError(message, opts);
}

/**
 * Shared HTTP transport used by all sub-clients.
 */
export class HttpTransport {
  readonly baseUrl: string;
  readonly timeout: number;
  private readonly apiKey: string;
  private readonly _fetch: typeof globalThis.fetch;

  constructor(options: HttpOptions) {
    this.baseUrl = options.baseUrl;
    this.timeout = options.timeout;
    this.apiKey = options.apiKey;
    this._fetch = options._fetch;
  }

  private headers(): Record<string, string> {
    return {
      "X-Api-Key": this.apiKey,
      "User-Agent": USER_AGENT,
      Accept: "application/json",
      "Content-Type": "application/json",
    };
  }

  async get<T>(path: string, params?: Record<string, string | number | boolean>): Promise<T> {
    const url = new URL(path, this.baseUrl);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }
    const response = await this._fetch(url.toString(), {
      method: "GET",
      headers: this.headers(),
      signal: AbortSignal.timeout(this.timeout),
    });
    if (!response.ok) await handleError(response);
    return response.json() as Promise<T>;
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const url = new URL(path, this.baseUrl);
    const response = await this._fetch(url.toString(), {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.timeout),
    });
    if (!response.ok) await handleError(response);
    return response.json() as Promise<T>;
  }

  async put<T>(path: string, body: unknown): Promise<T> {
    const url = new URL(path, this.baseUrl);
    const response = await this._fetch(url.toString(), {
      method: "PUT",
      headers: this.headers(),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.timeout),
    });
    if (!response.ok) await handleError(response);
    return response.json() as Promise<T>;
  }

  async delete(path: string): Promise<void> {
    const url = new URL(path, this.baseUrl);
    const response = await this._fetch(url.toString(), {
      method: "DELETE",
      headers: this.headers(),
      signal: AbortSignal.timeout(this.timeout),
    });
    if (!response.ok) await handleError(response);
  }
}
