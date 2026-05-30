/**
 * Closed value sets for the Jobo Enterprise Jobs API.
 *
 * Each value is exported twice: as a runtime const object (for ergonomic,
 * autocompleted access like `WorkModel.Remote`) and as a string-literal union
 * type of the same name. The option types accept `<Enum> | (string & {})`, so
 * the literal values autocomplete while any raw string remains valid — these
 * are plain snake_case wire strings, so nothing is transformed.
 *
 * @example
 * import { WorkModel, ExperienceLevel } from "jobo-enterprise";
 * await client.search.search({
 *   workModel: WorkModel.Remote,
 *   experienceLevel: ExperienceLevel.Senior,
 * });
 */

/** Where the job is performed (`work_model` / `workplace_type`). */
export const WorkModel = {
  Remote: "remote",
  Hybrid: "hybrid",
  Onsite: "onsite",
} as const;
export type WorkModel = (typeof WorkModel)[keyof typeof WorkModel];

/** Nature of the engagement (`employment_type`). */
export const EmploymentType = {
  FullTime: "full_time",
  PartTime: "part_time",
  Contract: "contract",
  Internship: "internship",
  Temporary: "temporary",
} as const;
export type EmploymentType = (typeof EmploymentType)[keyof typeof EmploymentType];

/** Seniority of the role (`experience_level`). */
export const ExperienceLevel = {
  Entry: "entry",
  Mid: "mid",
  Senior: "senior",
  Lead: "lead",
  Executive: "executive",
} as const;
export type ExperienceLevel = (typeof ExperienceLevel)[keyof typeof ExperienceLevel];

/** Period a compensation range refers to (`compensation.period`). */
export const CompensationPeriod = {
  Hour: "hour",
  Day: "day",
  Week: "week",
  Month: "month",
  Year: "year",
} as const;
export type CompensationPeriod = (typeof CompensationPeriod)[keyof typeof CompensationPeriod];

/** Classification of a qualification skill (`skills[].type`). */
export const SkillType = {
  Hard: "hard",
  Soft: "soft",
} as const;
export type SkillType = (typeof SkillType)[keyof typeof SkillType];

/**
 * Helper alias: a known enum value `T`, while still accepting any other string.
 * Keeps editor autocomplete for the closed set without rejecting custom values.
 */
export type OrString<T extends string> = T | (string & {});
