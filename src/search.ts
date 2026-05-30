import { HttpTransport, toISOString, stripUndefined } from "./base";
import type {
  EmploymentType,
  ExperienceLevel,
  OrString,
  WorkModel,
} from "./enums";
import type {
  InclusionExclusionFilter,
  Job,
  JobSearchBodyRequest,
  JobSearchResponse,
  RangeFilter,
} from "./models";

export interface SearchJobsOptions {
  q?: string;
  location?: string;
  sources?: string;
  workModel?: OrString<WorkModel>;
  employmentType?: OrString<EmploymentType>;
  experienceLevel?: OrString<ExperienceLevel>;
  postedAfter?: Date | string;
  minSalaryUsd?: number;
  maxSalaryUsd?: number;
  skills?: string;
  industries?: string;
  /** Comma-separated facets. Pass "" to skip facets; omit for the default subset. */
  includeFacets?: string;
  page?: number;
  pageSize?: number;
}

export interface SearchJobsAdvancedOptions {
  queries?: string[];
  locations?: string[];
  sources?: string[];
  skills?: InclusionExclusionFilter;
  companies?: InclusionExclusionFilter;
  industries?: InclusionExclusionFilter;
  workModels?: Array<OrString<WorkModel>>;
  employmentTypes?: Array<OrString<EmploymentType>>;
  experienceLevels?: Array<OrString<ExperienceLevel>>;
  salaryUsd?: RangeFilter;
  postedAfter?: Date | string | null;
  includeFacets?: string[];
  page?: number;
  pageSize?: number;
}

function buildBody(options: SearchJobsAdvancedOptions): JobSearchBodyRequest {
  return stripUndefined({
    queries: options.queries,
    locations: options.locations,
    sources: options.sources,
    skills: options.skills,
    companies: options.companies,
    industries: options.industries,
    work_models: options.workModels,
    employment_types: options.employmentTypes,
    experience_levels: options.experienceLevels,
    salary_usd: options.salaryUsd,
    posted_after: options.postedAfter ? toISOString(options.postedAfter) : undefined,
    include_facets: options.includeFacets,
    page: options.page ?? 1,
    page_size: options.pageSize ?? 25,
  }) as JobSearchBodyRequest;
}

/**
 * Sub-client for the Jobs Search endpoints.
 *
 * Access via `client.search`.
 */
export class JobsSearchClient {
  /** @internal */
  constructor(private readonly http: HttpTransport) {}

  /**
   * Search jobs using simple query parameters (GET /api/jobs).
   */
  async search(options: SearchJobsOptions = {}): Promise<JobSearchResponse> {
    const params: Record<string, string | number | boolean> = {};
    if (options.q) params.q = options.q;
    if (options.location) params.location = options.location;
    if (options.sources) params.sources = options.sources;
    if (options.workModel) params.work_model = options.workModel;
    if (options.employmentType) params.employment_type = options.employmentType;
    if (options.experienceLevel) params.experience_level = options.experienceLevel;
    if (options.postedAfter) params.posted_after = toISOString(options.postedAfter);
    if (options.minSalaryUsd !== undefined) params.min_salary_usd = options.minSalaryUsd;
    if (options.maxSalaryUsd !== undefined) params.max_salary_usd = options.maxSalaryUsd;
    if (options.skills) params.skills = options.skills;
    if (options.industries) params.industries = options.industries;
    if (options.includeFacets !== undefined) params.include_facets = options.includeFacets;
    params.page = options.page ?? 1;
    params.page_size = options.pageSize ?? 25;
    return this.http.get<JobSearchResponse>("/api/jobs", params);
  }

  /**
   * Search jobs using the advanced body-based endpoint (POST /api/jobs/search).
   */
  async searchAdvanced(options: SearchJobsAdvancedOptions = {}): Promise<JobSearchResponse> {
    return this.http.post<JobSearchResponse>("/api/jobs/search", buildBody(options));
  }

  /**
   * Async generator that yields all search results, handling page-based pagination automatically.
   *
   * Uses the advanced search endpoint under the hood.
   */
  async *iter(
    options: Omit<SearchJobsAdvancedOptions, "page"> = {}
  ): AsyncGenerator<Job, void, undefined> {
    let page = 1;
    while (true) {
      const response = await this.searchAdvanced({ ...options, includeFacets: [], page });
      for (const job of response.jobs) {
        yield job;
      }
      if (page >= response.total_pages) break;
      page++;
    }
  }
}
