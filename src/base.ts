import {
  JoboError,
  JoboAuthenticationError,
  JoboCursorRestartRequiredError,
  JoboNotFoundError,
  JoboPermissionError,
  JoboRateLimitError,
  JoboServerError,
  JoboValidationError,
  type JoboErrorOptions,
} from "./errors";

export interface HttpOptions {
  baseUrl: string;
  timeout: number;
  feedTimeout: number;
  apiKey: string;
  _fetch: typeof globalThis.fetch;
}

const USER_AGENT = "jobo-node/4.0.0";

/** Statuses the API documents as transient. Everything else fails immediately. */
const RETRY_STATUSES = new Set([429, 503]);

/** Retries *after* the initial attempt, so 3 means at most 4 requests. */
const MAX_RETRIES = 3;

/** Upper bound on a single backoff sleep, including a server `Retry-After`. */
const MAX_BACKOFF_MS = 30_000;

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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Honour `Retry-After` when present, else exponential backoff. */
function backoffMs(response: Response, attempt: number): number {
  const retryAfter = response.headers.get("Retry-After");
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) return Math.min(seconds * 1000, MAX_BACKOFF_MS);
  }
  return Math.min(500 * 2 ** attempt, MAX_BACKOFF_MS);
}

async function handleError(response: Response): Promise<never> {
  const status = response.status;
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = await response.text().catch(() => "");
  }

  const problem =
    typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  const detail =
    "detail" in problem
      ? String(problem.detail)
      : "error" in problem
        ? String(problem.error)
        : String(body);
  const message = detail ? `HTTP ${status}: ${detail}` : `HTTP ${status}`;
  const opts: JoboErrorOptions = {
    statusCode: status,
    detail,
    responseBody: body,
    code: typeof problem.code === "string" ? problem.code : undefined,
    apiVersion: typeof problem.api_version === "string" ? problem.api_version : undefined,
  };

  if (status === 401) throw new JoboAuthenticationError(message, opts);
  if (status === 403) throw new JoboPermissionError(message, opts);
  if (status === 404) throw new JoboNotFoundError(message, opts);
  if (status === 409) throw new JoboCursorRestartRequiredError(message, opts);
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
 *
 * Transient statuses (429, 503) are retried with bounded backoff honouring
 * `Retry-After`; everything else raises a typed error straight away.
 */
export class HttpTransport {
  readonly baseUrl: string;
  readonly timeout: number;
  readonly feedTimeout: number;
  private readonly apiKey: string;
  private readonly _fetch: typeof globalThis.fetch;

  constructor(options: HttpOptions) {
    this.baseUrl = options.baseUrl;
    this.timeout = options.timeout;
    this.feedTimeout = options.feedTimeout;
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

  private async send(
    url: string,
    init: Omit<RequestInit, "signal" | "headers">,
    timeout: number
  ): Promise<Response> {
    for (let attempt = 0; ; attempt++) {
      const response = await this._fetch(url, {
        ...init,
        headers: this.headers(),
        signal: AbortSignal.timeout(timeout),
      });
      if (response.ok) return response;
      if (RETRY_STATUSES.has(response.status) && attempt < MAX_RETRIES) {
        await sleep(backoffMs(response, attempt));
        continue;
      }
      await handleError(response);
    }
  }

  async get<T>(
    path: string,
    params?: Record<string, string | number | boolean>,
    timeout?: number
  ): Promise<T> {
    const url = new URL(path, this.baseUrl);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }
    const response = await this.send(url.toString(), { method: "GET" }, timeout ?? this.timeout);
    return response.json() as Promise<T>;
  }

  async post<T>(path: string, body: unknown, timeout?: number): Promise<T> {
    const url = new URL(path, this.baseUrl);
    const response = await this.send(
      url.toString(),
      { method: "POST", body: JSON.stringify(body) },
      timeout ?? this.timeout
    );
    return response.json() as Promise<T>;
  }
}
