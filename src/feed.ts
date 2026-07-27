import { HttpTransport, toISOString, stripUndefined } from "./base";
import type { EmploymentType, ExperienceLevel, OrString, WorkModel } from "./enums";
import type {
  Job,
  JobFeedRequest,
  JobFeedResponse,
  ExpiredJobIdsResponse,
  LocationFilter,
  ManagedJobFeedRequest,
} from "./models";

const FEED_PATH = "/api/jobs/feed";
const MANAGED_FEED_PATH = "/api/jobs/feed/managed";

export interface GetJobsFeedOptions {
  locations?: LocationFilter[];
  sources?: string[];
  workModels?: Array<OrString<WorkModel>>;
  employmentTypes?: Array<OrString<EmploymentType>>;
  experienceLevels?: Array<OrString<ExperienceLevel>>;
  postedAfter?: Date | string | null;
  /** Jobs created or updated at or after this — the incremental-sync watermark. */
  updatedAfter?: Date | string | null;
  /**
   * Page by immutable creation time. Defaults to `true` server-side; pass
   * `false` for the legacy update-recency ordering.
   */
  stableScan?: boolean;
  /**
   * Cursor from a previous response. When supplied it is sent on its own — the
   * cursor already carries the filters and batch size from the first request,
   * and anything sent beside it is ignored.
   */
  cursor?: string | null;
  batchSize?: number;
}

export interface GetManagedJobsFeedOptions {
  sources?: string[];
  workModels?: Array<OrString<WorkModel>>;
  postedAfter?: Date | string | null;
  updatedAfter?: Date | string | null;
  cursor?: string | null;
  batchSize?: number;
}

export interface GetExpiredJobIdsOptions {
  /** Optional — defaults to 24 hours ago server-side. Maximum lookback is 7 days. */
  expiredSince?: Date | string;
  cursor?: string | null;
  batchSize?: number;
}

function feedBody(options: GetJobsFeedOptions): JobFeedRequest {
  return stripUndefined({
    locations: options.locations,
    sources: options.sources,
    work_models: options.workModels,
    employment_types: options.employmentTypes,
    experience_levels: options.experienceLevels,
    posted_after: options.postedAfter ? toISOString(options.postedAfter) : undefined,
    updated_after: options.updatedAfter ? toISOString(options.updatedAfter) : undefined,
    stable_scan: options.stableScan,
    batch_size: options.batchSize ?? 1000,
  }) as JobFeedRequest;
}

function managedFeedBody(options: GetManagedJobsFeedOptions): ManagedJobFeedRequest {
  return stripUndefined({
    sources: options.sources,
    work_models: options.workModels,
    posted_after: options.postedAfter ? toISOString(options.postedAfter) : undefined,
    updated_after: options.updatedAfter ? toISOString(options.updatedAfter) : undefined,
    batch_size: options.batchSize ?? 1000,
  }) as ManagedJobFeedRequest;
}

/**
 * Sub-client for the Jobs Feed endpoints.
 *
 * Access via `client.feed`.
 */
export class JobsFeedClient {
  /** @internal */
  constructor(private readonly http: HttpTransport) {}

  /**
   * Fetch a single batch of jobs from the feed.
   */
  async getJobs(options: GetJobsFeedOptions = {}): Promise<JobFeedResponse> {
    const body = options.cursor ? { cursor: options.cursor } : feedBody(options);
    return this.http.post<JobFeedResponse>(FEED_PATH, body, this.http.feedTimeout);
  }

  /**
   * Async generator that yields all jobs from the feed, handling cursor pagination automatically.
   */
  async *iterJobs(
    options: Omit<GetJobsFeedOptions, "cursor"> = {}
  ): AsyncGenerator<Job, void, undefined> {
    let response = await this.getJobs(options);
    while (true) {
      for (const job of response.jobs) {
        yield job;
      }
      if (!response.has_more || !response.next_cursor) break;
      response = await this.getJobs({ cursor: response.next_cursor });
    }
  }

  /**
   * Fetch a single batch from the managed feed (POST /api/jobs/feed/managed).
   *
   * Returns only jobs from companies configured through Managed Job Scraping in
   * the Jobo portal. Same batch and cursor semantics as {@link getJobs}, with no
   * `locations` filter. Throws `JoboPermissionError` for sandbox and marketplace
   * keys, which carry no managed job sources.
   */
  async getManagedJobs(options: GetManagedJobsFeedOptions = {}): Promise<JobFeedResponse> {
    const body = options.cursor ? { cursor: options.cursor } : managedFeedBody(options);
    return this.http.post<JobFeedResponse>(MANAGED_FEED_PATH, body, this.http.feedTimeout);
  }

  /**
   * Async generator over the whole managed feed, handling pagination.
   */
  async *iterManagedJobs(
    options: Omit<GetManagedJobsFeedOptions, "cursor"> = {}
  ): AsyncGenerator<Job, void, undefined> {
    let response = await this.getManagedJobs(options);
    while (true) {
      for (const job of response.jobs) {
        yield job;
      }
      if (!response.has_more || !response.next_cursor) break;
      response = await this.getManagedJobs({ cursor: response.next_cursor });
    }
  }

  /**
   * Fetch a single batch of expired job IDs.
   */
  async getExpiredJobIds(options: GetExpiredJobIdsOptions = {}): Promise<ExpiredJobIdsResponse> {
    const params: Record<string, string | number> = {
      batch_size: options.batchSize ?? 1000,
    };
    if (options.expiredSince) {
      params.expired_since = toISOString(options.expiredSince);
    }
    if (options.cursor) {
      params.cursor = options.cursor;
    }
    return this.http.get<ExpiredJobIdsResponse>("/api/jobs/expired", params);
  }

  /**
   * Async generator that yields all expired job IDs, handling cursor pagination automatically.
   */
  async *iterExpiredJobIds(
    options: Omit<GetExpiredJobIdsOptions, "cursor"> = {}
  ): AsyncGenerator<string, void, undefined> {
    let cursor: string | null | undefined = null;
    while (true) {
      const response = await this.getExpiredJobIds({ ...options, cursor });
      for (const id of response.job_ids) {
        yield id;
      }
      if (!response.has_more || !response.next_cursor) break;
      cursor = response.next_cursor;
    }
  }
}
