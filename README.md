<img src="https://raw.githubusercontent.com/Prakkie91/jobo-node/main/jobo-logo.png" alt="Jobo" width="120" />

# Jobo Enterprise — Node.js / TypeScript Client

**Access millions of job listings, enriched company profiles, and geocoding — all from a single API.**

[![npm](https://img.shields.io/npm/v/jobo-enterprise)](https://www.npmjs.com/package/jobo-enterprise)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4+-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## Features

| Sub-client          | Property            | Description                                              |
| ------------------- | ------------------- | -------------------------------------------------------- |
| **Jobs Feed**       | `client.feed`       | Bulk and managed job feeds with cursor-based pagination (106 ATS) |
| **Jobs Search**     | `client.search`     | Full-text search, filters, facets, and single-job lookup |
| **Companies**       | `client.companies`  | Enriched company profiles and per-company job listings   |
| **Locations**       | `client.locations`  | Geocode location strings into structured coordinates     |

> **Get your API key** → [enterprise.jobo.world/api-keys](https://enterprise.jobo.world/api-keys)

---

## Installation

```bash
npm install jobo-enterprise
# or
yarn add jobo-enterprise
# or
pnpm add jobo-enterprise
```

## Quick Start

```typescript
import { JoboClient } from "jobo-enterprise";

const client = new JoboClient({ apiKey: "your-api-key" });

// Search for jobs
const results = await client.search.search({ q: "software engineer", location: "San Francisco" });
for (const job of results.jobs) {
  console.log(`${job.title} at ${job.company.name}`);
}

// Geocode a location
const geo = await client.locations.geocode("London, UK");
console.log(`${geo.locations[0].display_name}: ${geo.locations[0].latitude}, ${geo.locations[0].longitude}`);
```

## Authentication

```typescript
const client = new JoboClient({ apiKey: "your-api-key" });
```

---

## Jobs Feed — `client.feed`

Bulk-sync millions of active jobs using cursor-based pagination.

### Fetch a batch

```typescript
const response = await client.feed.getJobs({
  locations: [
    { country: "US", region: "California" },
    { country: "US", city: "New York" },
  ],
  sources: ["greenhouse", "workday"],
  workModels: ["remote", "hybrid"],
  batchSize: 1000,
});

console.log(`Got ${response.jobs.length} jobs, has_more=${response.has_more}`);
```

### Auto-paginate all jobs

```typescript
for await (const job of client.feed.iterJobs({
  batchSize: 1000,
  sources: ["greenhouse"],
})) {
  await saveToDatabase(job);
}
```

### Incremental sync

After the initial backfill, pass `updatedAfter` to pick up only what changed.
Scans page by immutable creation time by default (`stableScan`), so records
cannot shift across page boundaries while you are reading.

```typescript
const since = new Date(Date.now() - 60 * 60 * 1000);

for await (const job of client.feed.iterJobs({ updatedAfter: since, batchSize: 1000 })) {
  await upsert(job);
}
```

### Managed feed

Jobs from the companies you configured through **Managed Job Scraping** in the
Jobo portal. Same batch and cursor semantics, minus the `locations` filter.

```typescript
for await (const job of client.feed.iterManagedJobs({ batchSize: 1000 })) {
  await saveToDatabase(job);
}
```

### Expired job IDs

`expiredSince` is optional and defaults to 24 hours ago. Maximum lookback is 7 days.

```typescript
for await (const jobId of client.feed.iterExpiredJobIds()) {
  await markAsExpired(jobId);
}
```

---

## Jobs Search — `client.search`

Full-text search with filters and page-based pagination.

### Simple search

```typescript
import { WorkModel } from "jobo-enterprise";

const results = await client.search.search({
  q: "data scientist",
  location: "New York",
  sources: "greenhouse,lever",
  workModel: WorkModel.Remote, // or just "remote"
  minSalaryUsd: 120000,
  pageSize: 50,
});

console.log(`Found ${results.total} jobs across ${results.total_pages} pages`);
```

> **Closed value sets.** Parameters with a fixed set of accepted values ship as
> const objects for autocomplete — `WorkModel`, `EmploymentType`,
> `ExperienceLevel`, `CompensationPeriod`, and `SkillType`. Each is also a
> string-literal union type of the same name, and the options accept any raw
> string, so passing the literal (e.g. `"remote"`) is always valid too. Values
> are lowercase and hyphenated (`"full-time"`, `"per-diem"`); the API matches
> them exactly, so a misspelt value simply matches nothing.

### Fetch one job

```typescript
const job = await client.search.getJob("a1b2c3d4-e5f6-7890-abcd-ef1234567890");
```

Unmetered — this endpoint deducts no credits, which makes it a cheap way to wire
up an integration.

### Trim the payload

Omit `includeFields` for the whole job, pass a subset to keep only those heavy
fields, or pass an empty value for core fields only.

```typescript
const results = await client.search.search({
  q: "data scientist",
  includeFields: "summary",
  pageSize: 50,
});
```

### Advanced search (typed filters & facets)

```typescript
const results = await client.search.searchAdvanced({
  queries: ["machine learning engineer", "ML engineer", "AI engineer"],
  locations: ["San Francisco", "New York"],
  sources: ["greenhouse", "lever", "ashby"],
  workModels: ["remote", "hybrid"],
  skills: { include: ["python"], exclude: ["php"] },
  salaryUsd: { min: 150000 },
  includeFacets: ["work_model", "experience_level"],
  pageSize: 100,
});

for (const [facet, buckets] of Object.entries(results.facets)) {
  console.log(facet, buckets.map((b) => [b.key, b.count]));
}
```

### Auto-paginate all results

```typescript
for await (const job of client.search.iter({
  queries: ["backend engineer"],
  locations: ["London"],
  pageSize: 100,
})) {
  console.log(`${job.title} — ${job.company.name}`);
}
```

---

## Companies — `client.companies`

Fetch fully enriched company profiles and list jobs scoped to a company.

```typescript
const company = await client.companies.get(job.company.id);
console.log(company.name, company.website, company.industries);

// Jobs for a single company (paginated)
const jobs = await client.companies.getJobs(job.company.id, { pageSize: 50 });
console.log(`${jobs.total} jobs at ${company.name}`);
```

---

## Locations — `client.locations`

Geocode location strings into structured data with coordinates.

```typescript
const result = await client.locations.geocode("San Francisco, CA");

for (const location of result.locations) {
  console.log(`${location.display_name}: ${location.latitude}, ${location.longitude}`);
}
```

---

## Auto Apply

Not covered by this client. The Auto Apply contract is profileless and
callback-driven, and application creation is not yet open to traffic. Call it
over plain HTTPS — see the
[Auto Apply reference](https://jobo.world/docs/api-reference/auto-apply/auto-apply).

---

## Error Handling

`429` and `503` are retried for you with bounded backoff, honouring
`Retry-After`. Everything else throws immediately, as a subclass of `JoboError`:

```typescript
import {
  JoboAuthenticationError,
  JoboPermissionError,
  JoboNotFoundError,
  JoboRateLimitError,
  JoboValidationError,
  JoboCursorRestartRequiredError,
  JoboServerError,
  JoboError,
} from "jobo-enterprise";

try {
  const results = await client.search.search({ q: "engineer" });
} catch (error) {
  if (error instanceof JoboAuthenticationError) {
    console.error("Invalid API key");
  } else if (error instanceof JoboPermissionError) {
    console.error("Key is not entitled to this resource");
  } else if (error instanceof JoboNotFoundError) {
    console.error("No such job or company");
  } else if (error instanceof JoboRateLimitError) {
    console.error(`Rate limited. Retry after ${error.retryAfter}s`);
  } else if (error instanceof JoboValidationError) {
    console.error(`Bad request: ${error.detail} (${error.code})`);
  } else if (error instanceof JoboCursorRestartRequiredError) {
    console.error("Feed cursor is spent — discard it and start a new scan");
  } else if (error instanceof JoboServerError) {
    console.error("Server error — try again later");
  }
}
```

Every error carries the API's machine-readable problem `code` when one is
supplied, alongside `statusCode`, `detail`, and the raw `responseBody`.

## Supported ATS Sources (106)

| Category           | Sources                                                                                                                                       |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Enterprise ATS** | `workday`, `smartrecruiters`, `icims`, `successfactors`, `oraclecloud`, `taleo`, `dayforce`, `csod`, `adp`, `ultipro`, `paycom`               |
| **Tech & Startup** | `greenhouse`, `lever_co`, `ashby`, `workable`, `workable_jobs`, `rippling`, `polymer`, `gem`, `pinpoint`, `homerun`                           |
| **Mid-Market**     | `bamboohr`, `breezy`, `jazzhr`, `recruitee`, `personio`, `jobvite`, `teamtailor`, `comeet`, `trakstar`, `zoho`                                |
| **SMB & Niche**    | `gohire`, `recooty`, `applicantpro`, `hiringthing`, `careerplug`, `hirehive`, `kula`, `careerpuck`, `talnet`, `jobscore`                      |
| **Specialized**    | `freshteam`, `isolved`, `joincom`, `eightfold`, `phenompeople`                                                                                |

The full catalogue of 106 providers is listed in the
[API documentation](https://jobo.world/docs/sources). Treat it as an open set —
new `provider_id` values appear as platforms are added.

## Configuration

| Option        | Default                      | Description                             |
| ------------- | ---------------------------- | --------------------------------------- |
| `apiKey`      | _required_                   | Your API key                            |
| `baseUrl`     | `https://connect.jobo.world` | API base URL                            |
| `timeout`     | `30000`                      | Request timeout (ms)                    |
| `feedTimeout` | `120000`                     | Response timeout for the feed routes (ms) |
| `fetch`       | `globalThis.fetch`           | Custom fetch implementation             |

## Requirements

- **Node.js 18+** (uses built-in `fetch`)
- Also works in **Bun**, **Deno**, and modern browsers

## Use Cases

- **Build a job board** — Search and display jobs from 106 ATS platforms
- **Job aggregator** — Bulk-sync millions of listings with the feed endpoint
- **ATS data pipeline** — Pull jobs from Greenhouse, Lever, Workday, etc. into your data warehouse
- **Recruitment tools** — Power candidate-facing job search experiences
- **Company intelligence** — Enrich listings with funding, headcount, and tech-stack data
- **Location intelligence** — Geocode and normalize job locations

## Links

- **Website** — [jobo.world/enterprise](https://jobo.world/enterprise/)
- **Get API Key** — [enterprise.jobo.world/api-keys](https://enterprise.jobo.world/api-keys)
- **GitHub** — [github.com/Prakkie91/jobo-node](https://github.com/Prakkie91/jobo-node)
- **npm** — [npmjs.com/package/jobo-enterprise](https://www.npmjs.com/package/jobo-enterprise)

## License

MIT — see [LICENSE](LICENSE).
