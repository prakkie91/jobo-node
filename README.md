<img src="https://raw.githubusercontent.com/Prakkie91/jobo-node/main/jobo-logo.png" alt="Jobo" width="120" />

# Jobo Enterprise — Node.js / TypeScript Client

**Access millions of job listings, geocode locations, and automate job applications — all from a single API.**

[![npm](https://img.shields.io/npm/v/jobo-enterprise)](https://www.npmjs.com/package/jobo-enterprise)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4+-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## Features

| Sub-client          | Property            | Description                                              |
| ------------------- | ------------------- | -------------------------------------------------------- |
| **Jobs Feed**       | `client.feed`       | Bulk job feed with cursor-based pagination (45+ ATS)     |
| **Jobs Search**     | `client.search`     | Full-text search with location, work-model, and source filters |
| **Companies**       | `client.companies`  | Enriched company profiles and per-company job listings   |
| **Locations**       | `client.locations`  | Geocode location strings into structured coordinates     |
| **Auto Apply**      | `client.autoApply`  | Automate job applications with form field discovery      |

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

### Expired job IDs

```typescript
const expiredSince = new Date(Date.now() - 24 * 60 * 60 * 1000);

for await (const jobId of client.feed.iterExpiredJobIds({ expiredSince })) {
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
> string, so passing the literal (e.g. `"remote"`) is always valid too.

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

## Auto Apply — `client.autoApply`

Automate job applications with form field discovery and filling.

```typescript
import type { FieldAnswer } from "jobo-enterprise";

// Start a session
const session = await client.autoApply.startSession(job.apply_url);

console.log(`Provider: ${session.provider_display_name}`);
console.log(`Fields: ${session.fields.length}`);

// Fill in fields — `type` mirrors the FormFieldInfo.type of each field
const answers: FieldAnswer[] = [
  { field_id: "first_name", type: "text", value: "John" },
  { field_id: "last_name", type: "text", value: "Doe" },
  { field_id: "email", type: "text", value: "john@example.com" },
];

const result = await client.autoApply.setAnswers(session.session_id, answers);

if (result.is_terminal) {
  console.log("Application submitted!");
}

// Clean up
await client.autoApply.endSession(session.session_id);
```

### Profiles & one-shot run

```typescript
const profile = await client.autoApply.createProfile({
  name: "Default",
  first_name: "John",
  last_name: "Doe",
  email: "john@example.com",
  phone: "+1-555-0100",
});

// Run the full flow end-to-end against the stored profile
const run = await client.autoApply.run(profile.id, job.apply_url);
console.log(run.status, run.steps_completed, run.fields_filled);
```

---

## Error Handling

```typescript
import {
  JoboAuthenticationError,
  JoboRateLimitError,
  JoboValidationError,
  JoboServerError,
  JoboError,
} from "jobo-enterprise";

try {
  const results = await client.search.search({ q: "engineer" });
} catch (error) {
  if (error instanceof JoboAuthenticationError) {
    console.error("Invalid API key");
  } else if (error instanceof JoboRateLimitError) {
    console.error(`Rate limited. Retry after ${error.retryAfter}s`);
  } else if (error instanceof JoboValidationError) {
    console.error(`Bad request: ${error.detail}`);
  } else if (error instanceof JoboServerError) {
    console.error("Server error — try again later");
  }
}
```

## Supported ATS Sources (45+)

| Category           | Sources                                                                                                                                       |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Enterprise ATS** | `workday`, `smartrecruiters`, `icims`, `successfactors`, `oraclecloud`, `taleo`, `dayforce`, `csod`, `adp`, `ultipro`, `paycom`               |
| **Tech & Startup** | `greenhouse`, `lever_co`, `ashby`, `workable`, `workable_jobs`, `rippling`, `polymer`, `gem`, `pinpoint`, `homerun`                           |
| **Mid-Market**     | `bamboohr`, `breezy`, `jazzhr`, `recruitee`, `personio`, `jobvite`, `teamtailor`, `comeet`, `trakstar`, `zoho`                                |
| **SMB & Niche**    | `gohire`, `recooty`, `applicantpro`, `hiringthing`, `careerplug`, `hirehive`, `kula`, `careerpuck`, `talnet`, `jobscore`                      |
| **Specialized**    | `freshteam`, `isolved`, `joincom`, `eightfold`, `phenompeople`                                                                                |

## Configuration

| Option    | Default                       | Description                  |
| --------- | ----------------------------- | ---------------------------- |
| `apiKey`  | _required_                    | Your API key                 |
| `baseUrl` | `https://connect.jobo.world` | API base URL                 |
| `timeout` | `30000`                       | Request timeout (ms)         |
| `fetch`   | `globalThis.fetch`            | Custom fetch implementation  |

## Requirements

- **Node.js 18+** (uses built-in `fetch`)
- Also works in **Bun**, **Deno**, and modern browsers

## Use Cases

- **Build a job board** — Search and display jobs from 45+ ATS platforms
- **Job aggregator** — Bulk-sync millions of listings with the feed endpoint
- **ATS data pipeline** — Pull jobs from Greenhouse, Lever, Workday, etc. into your data warehouse
- **Recruitment tools** — Power candidate-facing job search experiences
- **Auto-apply automation** — Automate job applications at scale
- **Location intelligence** — Geocode and normalize job locations

## Links

- **Website** — [jobo.world/enterprise](https://jobo.world/enterprise/)
- **Get API Key** — [enterprise.jobo.world/api-keys](https://enterprise.jobo.world/api-keys)
- **GitHub** — [github.com/Prakkie91/jobo-node](https://github.com/Prakkie91/jobo-node)
- **npm** — [npmjs.com/package/jobo-enterprise](https://www.npmjs.com/package/jobo-enterprise)

## License

MIT — see [LICENSE](LICENSE).
