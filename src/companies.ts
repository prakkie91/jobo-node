import { HttpTransport, toISOString } from "./base";
import type { Company, JobSearchResponse } from "./models";

export interface GetCompanyJobsOptions {
  postedAfter?: Date | string;
  page?: number;
  pageSize?: number;
}

/**
 * Sub-client for the Companies endpoints.
 *
 * Access via `client.companies`.
 */
export class CompaniesClient {
  /** @internal */
  constructor(private readonly http: HttpTransport) {}

  /**
   * Fetch a fully enriched company profile (GET /api/companies/{id}).
   *
   * This endpoint is public — no API key required.
   *
   * @param companyId - The Jobo company UUID.
   * @returns A `Company` with the full enriched profile.
   */
  async get(companyId: string): Promise<Company> {
    return this.http.get<Company>(`/api/companies/${companyId}`);
  }

  /**
   * List jobs that belong to a specific company (GET /api/companies/{id}/jobs).
   *
   * @param companyId - The Jobo company UUID.
   * @param options - Optional pagination and `postedAfter` filter.
   * @returns A `JobSearchResponse` scoped to this company.
   */
  async getJobs(
    companyId: string,
    options: GetCompanyJobsOptions = {}
  ): Promise<JobSearchResponse> {
    const params: Record<string, string | number> = {
      page: options.page ?? 1,
      page_size: options.pageSize ?? 25,
    };
    if (options.postedAfter) {
      params.posted_after = toISOString(options.postedAfter);
    }
    return this.http.get<JobSearchResponse>(`/api/companies/${companyId}/jobs`, params);
  }
}
