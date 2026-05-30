import { HttpTransport, toISOString, stripUndefined } from "./base";
import type { OrString, WorkModel } from "./enums";
import type {
  Job,
  JobFeedRequest,
  JobFeedResponse,
  ExpiredJobIdsResponse,
  LocationFilter,
} from "./models";

export interface GetJobsFeedOptions {
  locations?: LocationFilter[];
  sources?: string[];
  workModels?: Array<OrString<WorkModel>>;
  postedAfter?: Date | string | null;
  cursor?: string | null;
  batchSize?: number;
}

export interface GetExpiredJobIdsOptions {
  expiredSince: Date | string;
  cursor?: string | null;
  batchSize?: number;
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
    const body: JobFeedRequest = stripUndefined({
      locations: options.locations,
      sources: options.sources,
      work_models: options.workModels,
      posted_after: options.postedAfter ? toISOString(options.postedAfter) : undefined,
      cursor: options.cursor,
      batch_size: options.batchSize ?? 1000,
    }) as JobFeedRequest;
    return this.http.post<JobFeedResponse>("/api/jobs/feed", body);
  }

  /**
   * Async generator that yields all jobs from the feed, handling cursor pagination automatically.
   */
  async *iterJobs(
    options: Omit<GetJobsFeedOptions, "cursor"> = {}
  ): AsyncGenerator<Job, void, undefined> {
    let cursor: string | null | undefined = null;
    while (true) {
      const response = await this.getJobs({ ...options, cursor });
      for (const job of response.jobs) {
        yield job;
      }
      if (!response.has_more) break;
      cursor = response.next_cursor;
    }
  }

  /**
   * Fetch a single batch of expired job IDs.
   */
  async getExpiredJobIds(options: GetExpiredJobIdsOptions): Promise<ExpiredJobIdsResponse> {
    const params: Record<string, string | number> = {
      expired_since: toISOString(options.expiredSince),
      batch_size: options.batchSize ?? 1000,
    };
    if (options.cursor) {
      params.cursor = options.cursor;
    }
    return this.http.get<ExpiredJobIdsResponse>("/api/jobs/expired", params);
  }

  /**
   * Async generator that yields all expired job IDs, handling cursor pagination automatically.
   */
  async *iterExpiredJobIds(
    options: Omit<GetExpiredJobIdsOptions, "cursor">
  ): AsyncGenerator<string, void, undefined> {
    let cursor: string | null | undefined = null;
    while (true) {
      const response = await this.getExpiredJobIds({ ...options, cursor });
      for (const id of response.job_ids) {
        yield id;
      }
      if (!response.has_more) break;
      cursor = response.next_cursor;
    }
  }
}
