export { JoboClient } from "./client";
export type { JoboClientOptions } from "./client";

// Sub-clients
export { JobsFeedClient } from "./feed";
export { JobsSearchClient } from "./search";
export { CompaniesClient } from "./companies";
export { LocationsClient } from "./locations";
export { AutoApplyClient } from "./auto-apply";

// Sub-client option types
export type { GetJobsFeedOptions, GetExpiredJobIdsOptions } from "./feed";
export type { SearchJobsOptions, SearchJobsAdvancedOptions } from "./search";
export type { GetCompanyJobsOptions } from "./companies";

// Enums (closed value sets). Each name is exported as both a runtime const
// object (e.g. `WorkModel.Remote`) and a string-literal union type of the same
// name, so it can be used in either position.
export {
  WorkModel,
  EmploymentType,
  ExperienceLevel,
  CompensationPeriod,
  SkillType,
} from "./enums";
export type { OrString } from "./enums";

// Models
export type {
  // Jobs
  Job,
  JobCompany,
  JobLocation,
  JobCompensation,
  JobQualifications,
  QualificationBucket,
  QualificationSkill,
  // Feed
  LocationFilter,
  JobFeedRequest,
  JobFeedResponse,
  ExpiredJobIdsResponse,
  // Search
  InclusionExclusionFilter,
  RangeFilter,
  JobSearchBodyRequest,
  JobSearchResponse,
  JobFacet,
  // Geocoding
  GeocodeResultItem,
  GeocodedLocation,
  // Companies
  Company,
  CompanyFundingRound,
  CompanyLeader,
  CompanyRating,
  CompanyPressReference,
  CompanyH1bJobCount,
  CompanyH1bTitleDistribution,
  CompanyTechnology,
  CompanyProduct,
  CompanyAcquisition,
  CompanyExit,
  CompanySubOrganization,
  CompanyFeaturedList,
  CompanyKeyEvent,
  CompanyEventAppearance,
  // AutoApply
  AutoApplySessionResponse,
  FieldAnswer,
  FieldOption,
  FormFieldInfo,
  ValidationError,
  StartAutoApplySessionRequest,
  SetAutoApplyAnswersRequest,
  RunAutoApplyRequest,
  RunAutoApplyResponse,
  AutoApplyStepLog,
  AutoApplyProfileRequest,
  AutoApplyProfileResponse,
} from "./models";

// Errors
export {
  JoboError,
  JoboAuthenticationError,
  JoboRateLimitError,
  JoboValidationError,
  JoboServerError,
} from "./errors";
