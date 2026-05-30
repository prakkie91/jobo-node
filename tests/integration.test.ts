import { describe, it, expect, beforeAll } from "vitest";
import { JoboClient } from "../src/client";
import { JoboAuthenticationError } from "../src/errors";
import type { Job, JobFeedResponse, JobSearchResponse } from "../src/models";

const API_KEY = process.env.JOBO_API_KEY;
const BASE_URL = process.env.JOBO_BASE_URL ?? "https://connect.jobo.world";

const describeIf = (condition: boolean) =>
  condition ? describe : describe.skip;

describeIf(!!API_KEY)("Jobo Enterprise Client – Integration Tests", () => {
  let client: JoboClient;

  beforeAll(() => {
    client = new JoboClient({ apiKey: API_KEY!, baseUrl: BASE_URL });
  });

  // ── Feed ────────────────────────────────────────────────────────

  describe("getJobsFeed", () => {
    it("returns jobs", async () => {
      const response = await client.feed.getJobs({ batchSize: 5 });

      expect(response).toBeDefined();
      expect(response.jobs.length).toBeGreaterThan(0);
      expect(response.jobs.length).toBeLessThanOrEqual(5);

      const job = response.jobs[0];
      expect(job.id).toBeTruthy();
      expect(job.title).toBeTruthy();
      expect(job.description).toBeTruthy();
      expect(job.listing_url).toBeTruthy();
      expect(job.source).toBeTruthy();
      expect(job.company).toBeDefined();
      expect(job.company.name).toBeTruthy();
    });

    it("supports location filter", async () => {
      const response = await client.feed.getJobs({
        locations: [{ country: "US" }],
        batchSize: 5,
      });

      expect(response).toBeDefined();
      expect(response.jobs.length).toBeGreaterThan(0);
    });

    it("supports cursor pagination", async () => {
      const first = await client.feed.getJobs({ batchSize: 2 });
      expect(first.jobs.length).toBeGreaterThan(0);

      if (!first.has_more) return; // small dataset

      expect(first.next_cursor).toBeTruthy();

      const second = await client.feed.getJobs({
        cursor: first.next_cursor,
        batchSize: 2,
      });

      expect(second).toBeDefined();
      expect(second.jobs.length).toBeGreaterThan(0);
      expect(second.jobs[0].id).not.toBe(first.jobs[0].id);
    });
  });

  describe("iterJobsFeed", () => {
    it("yields jobs via async generator", async () => {
      const jobs: Job[] = [];
      for await (const job of client.feed.iterJobs({ batchSize: 3 })) {
        jobs.push(job);
        if (jobs.length >= 5) break;
      }
      expect(jobs.length).toBeGreaterThan(0);
    });
  });

  // ── Expired ─────────────────────────────────────────────────────

  describe("getExpiredJobIds", () => {
    it("returns response without throwing", async () => {
      const response = await client.feed.getExpiredJobIds({
        expiredSince: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        batchSize: 5,
      });

      expect(response).toBeDefined();
      expect(response.job_ids).toBeDefined();
      expect(Array.isArray(response.job_ids)).toBe(true);
    });
  });

  // ── Search ──────────────────────────────────────────────────────

  describe("searchJobs", () => {
    it("returns results for a query", async () => {
      const response = await client.search.search({
        q: "software engineer",
        pageSize: 5,
      });

      expect(response).toBeDefined();
      expect(response.jobs.length).toBeGreaterThan(0);
      expect(response.total).toBeGreaterThan(0);
      expect(response.total_pages).toBeGreaterThanOrEqual(1);
      expect(response.page).toBe(1);
    });
  });

  describe("searchJobsAdvanced", () => {
    it("returns results", async () => {
      const response = await client.search.searchAdvanced({
        queries: ["data engineer"],
        pageSize: 5,
      });

      expect(response).toBeDefined();
      expect(response.jobs.length).toBeGreaterThan(0);
      expect(response.total).toBeGreaterThan(0);
    });

    it("supports location filter", async () => {
      const response = await client.search.searchAdvanced({
        queries: ["developer"],
        locations: ["New York"],
        pageSize: 5,
      });

      expect(response).toBeDefined();
      // May return 0 for very specific filters, but should not throw
    });
  });

  describe("iterSearchJobs", () => {
    it("yields jobs via async generator", async () => {
      const jobs: Job[] = [];
      for await (const job of client.search.iter({
        queries: ["engineer"],
        pageSize: 3,
      })) {
        jobs.push(job);
        if (jobs.length >= 5) break;
      }
      expect(jobs.length).toBeGreaterThan(0);
    });
  });

  // ── Job model validation ──────────────────────────────────────

  describe("Job model", () => {
    it("has all expected fields", async () => {
      const response = await client.search.search({
        q: "engineer",
        pageSize: 1,
      });
      expect(response.jobs.length).toBeGreaterThan(0);

      const job = response.jobs[0];
      expect(job.id).toBeTruthy();
      expect(job.title).toBeTruthy();
      expect(job.company).toBeDefined();
      expect(job.company.id).toBeTruthy();
      expect(job.company.name).toBeTruthy();
      expect(job.description).toBeTruthy();
      expect(job.listing_url).toBeTruthy();
      expect(job.apply_url).toBeTruthy();
      expect(job.source).toBeTruthy();
      expect(job.created_at).toBeTruthy();
      expect(job.updated_at).toBeTruthy();
      expect(Array.isArray(job.locations)).toBe(true);
      expect(job.qualifications).toBeDefined();
      expect(Array.isArray(job.responsibilities)).toBe(true);
      expect(Array.isArray(job.benefits)).toBe(true);
    });
  });

  // ── Companies ─────────────────────────────────────────────────────

  describe("companies", () => {
    it("fetches a company profile and its jobs", async () => {
      const search = await client.search.search({ q: "engineer", pageSize: 1 });
      if (search.jobs.length === 0) return; // no jobs to resolve a company id

      const companyId = search.jobs[0].company.id;

      const company = await client.companies.get(companyId);
      expect(company.id).toBe(companyId);
      expect(company.name).toBeTruthy();

      const jobs = await client.companies.getJobs(companyId, { pageSize: 5 });
      expect(jobs).toBeDefined();
      expect(jobs.page).toBe(1);
    });
  });

  // ── Search facets ─────────────────────────────────────────────────

  describe("searchFacets", () => {
    it("returns a facets map from advanced search", async () => {
      const response = await client.search.searchAdvanced({
        queries: ["engineer"],
        includeFacets: ["work_model", "experience_level"],
        pageSize: 5,
      });

      expect(response).toBeDefined();
      expect(typeof response.facets).toBe("object");
    });
  });

  // ── Geocoding ────────────────────────────────────────────────────

  describe("geocode", () => {
    it("returns location for valid input", async () => {
      const result = await client.locations.geocode("San Francisco, CA");

      expect(result).toBeDefined();
      expect(result.input).toBe("San Francisco, CA");
      expect(result.succeeded).toBe(true);
      expect(result.locations.length).toBeGreaterThan(0);
      const location = result.locations[0];
      expect(location.display_name).toBeTruthy();
      expect(location.latitude).toBeDefined();
      expect(location.longitude).toBeDefined();
    });

    it("handles invalid location", async () => {
      // The geocode endpoint can hang server-side on an unresolvable string,
      // so use a short timeout and accept either a response or a clean timeout
      // — both mean the SDK handled the input without crashing.
      const shortClient = new JoboClient({
        apiKey: API_KEY!,
        baseUrl: BASE_URL,
        timeout: 10_000,
      });
      try {
        const result = await shortClient.locations.geocode("invalidlocationxyz123");
        expect(result).toBeDefined();
      } catch (err) {
        expect((err as Error).name).toBe("TimeoutError");
      }
    });
  });

  // ── AutoApply (disabled – not yet implemented) ────────────────────

  describe.skip("AutoApply", () => {
    it("startSession returns session", async () => {
      const response = await client.autoApply.startSession(
        "https://invalid-url-that-does-not-exist.com/jobs/123"
      );

      expect(response).toBeDefined();
      expect(response.session_id).toBeTruthy();
    });

    it("endSession returns false for invalid session", async () => {
      const result = await client.autoApply.endSession(
        "00000000-0000-0000-0000-000000000000"
      );

      expect(result).toBe(false);
    });
  });
});

// ── Error handling (always runs, no API key needed) ─────────────

describe("Error handling", () => {
  it("throws JoboAuthenticationError for invalid API key", async () => {
    const badClient = new JoboClient({
      apiKey: "invalid-key-12345",
      baseUrl: BASE_URL,
    });

    await expect(
      badClient.feed.getJobs({ batchSize: 1 })
    ).rejects.toThrow(JoboAuthenticationError);
  });
});
