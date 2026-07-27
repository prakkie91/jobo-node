/** Fields every Jobo error carries, lifted off the API's problem body. */
export interface JoboErrorOptions {
  statusCode?: number;
  detail?: string;
  responseBody?: unknown;
  /** Stable machine-readable problem code, when the API supplies one. */
  code?: string;
  apiVersion?: string;
}

/** Base error for all Jobo client errors. */
export class JoboError extends Error {
  public readonly statusCode?: number;
  public readonly detail?: string;
  public readonly responseBody?: unknown;
  public readonly code?: string;
  public readonly apiVersion?: string;

  constructor(message: string, options?: JoboErrorOptions) {
    super(message);
    this.name = "JoboError";
    this.statusCode = options?.statusCode;
    this.detail = options?.detail;
    this.responseBody = options?.responseBody;
    this.code = options?.code;
    this.apiVersion = options?.apiVersion;
  }
}

/** Raised when the API key is missing or invalid (401). */
export class JoboAuthenticationError extends JoboError {
  constructor(message: string, options?: JoboErrorOptions) {
    super(message, options);
    this.name = "JoboAuthenticationError";
  }
}

/**
 * Raised when the key is valid but not entitled to the resource (403).
 *
 * The managed feed throws this for sandbox and marketplace keys, which carry no
 * customer account and therefore no managed job sources.
 */
export class JoboPermissionError extends JoboError {
  constructor(message: string, options?: JoboErrorOptions) {
    super(message, options);
    this.name = "JoboPermissionError";
  }
}

/** Raised when the requested resource does not exist (404). */
export class JoboNotFoundError extends JoboError {
  constructor(message: string, options?: JoboErrorOptions) {
    super(message, options);
    this.name = "JoboNotFoundError";
  }
}

/** Raised when the rate limit is exceeded (429) and retries are exhausted. */
export class JoboRateLimitError extends JoboError {
  public readonly retryAfter?: number;

  constructor(message: string, options?: JoboErrorOptions & { retryAfter?: number }) {
    super(message, options);
    this.name = "JoboRateLimitError";
    this.retryAfter = options?.retryAfter;
  }
}

/** Raised when the request is invalid (400). */
export class JoboValidationError extends JoboError {
  constructor(message: string, options?: JoboErrorOptions) {
    super(message, options);
    this.name = "JoboValidationError";
  }
}

/**
 * Raised when a feed cursor can no longer be continued (409).
 *
 * A legacy non-stable scan reached the deep-pagination boundary. The cursor
 * cannot be retried — discard it and start a new scan, leaving `stableScan` at
 * its default.
 */
export class JoboCursorRestartRequiredError extends JoboError {
  constructor(message: string, options?: JoboErrorOptions) {
    super(message, options);
    this.name = "JoboCursorRestartRequiredError";
  }
}

/** Raised when the server returns a 5xx error. */
export class JoboServerError extends JoboError {
  constructor(message: string, options?: JoboErrorOptions) {
    super(message, options);
    this.name = "JoboServerError";
  }
}
