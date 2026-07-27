import { HttpTransport } from "./base";
import { JobsFeedClient } from "./feed";
import { JobsSearchClient } from "./search";
import { CompaniesClient } from "./companies";
import { LocationsClient } from "./locations";

const DEFAULT_BASE_URL = "https://connect.jobo.world";
const DEFAULT_TIMEOUT = 30_000;

/**
 * The feed endpoints stream up to 1,000 full job records per call. The API docs
 * ask for a response timeout of at least 120 seconds on those routes.
 */
const DEFAULT_FEED_TIMEOUT = 120_000;

export interface JoboClientOptions {
  /** Your Jobo Enterprise API key. */
  apiKey: string;
  /** API base URL. Defaults to `https://connect.jobo.world`. */
  baseUrl?: string;
  /** Request timeout in milliseconds. Defaults to 30000. */
  timeout?: number;
  /**
   * Response timeout in milliseconds for the two feed endpoints, which stream
   * up to 1,000 full job records per call. Defaults to 120000.
   */
  feedTimeout?: number;
  /** Custom fetch implementation (e.g. for testing). */
  fetch?: typeof globalThis.fetch;
}

/**
 * Client for the Jobo Enterprise API.
 *
 * Access feature-specific sub-clients via properties:
 * - `client.feed` — Bulk job feed with cursor-based pagination
 * - `client.search` — Full-text job search with filters
 * - `client.companies` — Enriched company profiles and per-company jobs
 * - `client.locations` — Geocoding and location resolution
 *
 * Uses the built-in `fetch` API (Node 18+, Bun, Deno, browsers).
 */
export class JoboClient {
  private readonly http: HttpTransport;

  /** Bulk job feed with cursor-based pagination. */
  readonly feed: JobsFeedClient;
  /** Full-text job search with filters and pagination. */
  readonly search: JobsSearchClient;
  /** Enriched company profiles and per-company job listings. */
  readonly companies: CompaniesClient;
  /** Geocoding and location resolution. */
  readonly locations: LocationsClient;

  constructor(options: JoboClientOptions) {
    this.http = new HttpTransport({
      baseUrl: (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, ""),
      timeout: options.timeout ?? DEFAULT_TIMEOUT,
      feedTimeout: options.feedTimeout ?? DEFAULT_FEED_TIMEOUT,
      apiKey: options.apiKey,
      _fetch: options.fetch ?? globalThis.fetch.bind(globalThis),
    });

    this.feed = new JobsFeedClient(this.http);
    this.search = new JobsSearchClient(this.http);
    this.companies = new CompaniesClient(this.http);
    this.locations = new LocationsClient(this.http);
  }
}
