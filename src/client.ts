import { HttpTransport } from "./base";
import { JobsFeedClient } from "./feed";
import { JobsSearchClient } from "./search";
import { CompaniesClient } from "./companies";
import { LocationsClient } from "./locations";
import { AutoApplyClient } from "./auto-apply";

const DEFAULT_BASE_URL = "https://connect.jobo.world";
const DEFAULT_TIMEOUT = 30_000;

export interface JoboClientOptions {
  /** Your Jobo Enterprise API key. */
  apiKey: string;
  /** API base URL. Defaults to `https://connect.jobo.world`. */
  baseUrl?: string;
  /** Request timeout in milliseconds. Defaults to 30000. */
  timeout?: number;
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
 * - `client.autoApply` — Automated job application form filling
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
  /** Automated job application form filling. */
  readonly autoApply: AutoApplyClient;

  constructor(options: JoboClientOptions) {
    this.http = new HttpTransport({
      baseUrl: (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, ""),
      timeout: options.timeout ?? DEFAULT_TIMEOUT,
      apiKey: options.apiKey,
      _fetch: options.fetch ?? globalThis.fetch.bind(globalThis),
    });

    this.feed = new JobsFeedClient(this.http);
    this.search = new JobsSearchClient(this.http);
    this.companies = new CompaniesClient(this.http);
    this.locations = new LocationsClient(this.http);
    this.autoApply = new AutoApplyClient(this.http);
  }
}
