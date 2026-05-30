// All wire formats are snake_case, matching the canonical External API contract.

// ── Job models ───────────────────────────────────────────────────────

/** A typed skill with a name and classification ("hard" or "soft"). */
export interface QualificationSkill {
  name: string;
  type: string; // "hard" (technical) or "soft" (interpersonal)
}

/** A qualification bucket: education, certifications, and typed skills. */
export interface QualificationBucket {
  education: string[];
  certifications: string[];
  skills: QualificationSkill[];
}

/** Structured qualifications split into must-have and preferred buckets. */
export interface JobQualifications {
  must_have: QualificationBucket;
  preferred: QualificationBucket;
}

/** Company associated with a job listing. */
export interface JobCompany {
  id: string;
  name: string;
  website?: string | null;
  logo_url?: string | null;
  summary?: string | null;
  industries: string[];
  categories: string[];
  linkedin_url?: string | null;
  crunchbase_url?: string | null;
  details_url?: string | null;
}

/** Geographic location of a job. */
export interface JobLocation {
  location?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

/** Compensation details for a job. */
export interface JobCompensation {
  min?: number | null;
  max?: number | null;
  currency?: string | null;
  period?: string | null;
}

/** A job listing returned by the API. */
export interface Job {
  id: string;
  title: string;
  normalized_title?: string | null;
  company: JobCompany;
  description: string;
  summary?: string | null;
  listing_url: string;
  apply_url: string;
  locations: JobLocation[];
  compensation?: JobCompensation | null;
  employment_type?: string | null;
  workplace_type?: string | null;
  experience_level?: string | null;
  source: string;
  created_at: string;
  updated_at: string;
  date_posted?: string | null;
  valid_through?: string | null;
  qualifications: JobQualifications;
  responsibilities: string[];
  benefits: string[];
  is_work_auth_required?: boolean | null;
  is_h1b_sponsor?: boolean | null;
  is_clearance_required?: boolean | null;
}

// ── Feed models ──────────────────────────────────────────────────────

/** Structured location filter for the feed endpoint. */
export interface LocationFilter {
  country?: string;
  region?: string;
  city?: string;
}

/** Request body for the jobs feed endpoint (POST /api/jobs/feed). */
export interface JobFeedRequest {
  locations?: LocationFilter[];
  sources?: string[];
  work_models?: string[];
  posted_after?: string | null;
  cursor?: string | null;
  batch_size?: number;
}

/** Response from the jobs feed endpoint. */
export interface JobFeedResponse {
  jobs: Job[];
  next_cursor?: string | null;
  has_more: boolean;
}

/** Response from the expired job IDs endpoint. */
export interface ExpiredJobIdsResponse {
  job_ids: string[];
  next_cursor?: string | null;
  has_more: boolean;
}

// ── Search models ────────────────────────────────────────────────────

/** Include / exclude list filter. Items are matched case-insensitively. */
export interface InclusionExclusionFilter {
  include?: string[];
  exclude?: string[];
}

/** Numeric range filter with optional min / max bounds. */
export interface RangeFilter {
  min?: number;
  max?: number;
}

/** Request body for the advanced search endpoint (POST /api/jobs/search). */
export interface JobSearchBodyRequest {
  queries?: string[];
  locations?: string[];
  sources?: string[];
  skills?: InclusionExclusionFilter;
  companies?: InclusionExclusionFilter;
  industries?: InclusionExclusionFilter;
  work_models?: string[];
  employment_types?: string[];
  experience_levels?: string[];
  salary_usd?: RangeFilter;
  posted_after?: string | null;
  page?: number;
  page_size?: number;
  include_facets?: string[];
}

/** An aggregated facet count. */
export interface JobFacet {
  key: string;
  count: number;
}

/** Response from the search endpoints. */
export interface JobSearchResponse {
  jobs: Job[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  facets: Record<string, JobFacet[]>;
}

// ── Geocoding models ─────────────────────────────────────────────────

/** A resolved/geocoded location. */
export interface GeocodedLocation {
  city?: string | null;
  region?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  display_name?: string | null;
  country_code?: string | null;
  fuzzy_confidence?: number | null;
}

/** Response from the geocode endpoint. */
export interface GeocodeResultItem {
  input: string;
  succeeded: boolean;
  locations: GeocodedLocation[];
  method?: string | null;
  error?: string | null;
}

// ── Company models ───────────────────────────────────────────────────

/** A single funding round. */
export interface CompanyFundingRound {
  investment_type?: string | null;
  announced_on?: string | null;
  raised_amount?: string | null;
  post_money_valuation?: string | null;
  investor_count: number;
  lead_investor?: string | null;
}

/** A member of the company's leadership team. */
export interface CompanyLeader {
  name?: string | null;
  title?: string | null;
  linkedin_url?: string | null;
  avatar_url?: string | null;
}

/** A company rating from an external source (e.g. Glassdoor). */
export interface CompanyRating {
  source?: string | null;
  rating?: string | null;
  url?: string | null;
  review_count?: number | null;
}

/** A press article referencing the company. */
export interface CompanyPressReference {
  url?: string | null;
  posted_on?: string | null;
  title?: string | null;
  publisher?: string | null;
}

/** H1B sponsorship job count for a given year. */
export interface CompanyH1bJobCount {
  year?: string | null;
  count: number;
}

/** H1B sponsorship distribution by job title. */
export interface CompanyH1bTitleDistribution {
  title?: string | null;
  count: number;
}

/** A technology entry in the company's tech stack. */
export interface CompanyTechnology {
  name?: string | null;
  categories: string[];
}

/** A product or piece of software the company offers / uses. */
export interface CompanyProduct {
  name?: string | null;
  description?: string | null;
}

/** A company acquired by this company. */
export interface CompanyAcquisition {
  acquiree_name?: string | null;
  title?: string | null;
}

/** An exit event for the company. */
export interface CompanyExit {
  name?: string | null;
  description?: string | null;
}

/** A sub-organization of the company. */
export interface CompanySubOrganization {
  name?: string | null;
  ownership_type?: string | null;
  title?: string | null;
}

/** A featured list the company appears on. */
export interface CompanyFeaturedList {
  title?: string | null;
  org_num?: number | null;
  funding_total_formatted?: string | null;
  funding_total_usd?: number | null;
}

/** A dated event in the company's history (layoff, leadership hire, etc.). */
export interface CompanyKeyEvent {
  date?: string | null;
}

/** An event the company appeared at. */
export interface CompanyEventAppearance {
  appearance_type?: string | null;
  event?: string | null;
  event_starts_on?: string | null;
  image?: string | null;
}

/** A fully enriched company profile (GET /api/companies/{id}). */
export interface Company {
  id: string;
  name: string;
  legal_name?: string | null;
  summary?: string | null;
  description?: string | null;
  website?: string | null;
  listing_url?: string | null;
  logo_url?: string | null;

  // Socials
  linkedin_url?: string | null;
  linkedin_company_id?: string | null;
  twitter_url?: string | null;
  facebook_url?: string | null;
  instagram_url?: string | null;
  angellist_url?: string | null;
  youtube_url?: string | null;
  github_url?: string | null;
  g2_url?: string | null;
  crunchbase_url?: string | null;

  // Location
  headquarters_location?: string | null;
  headquarters_region?: string | null;
  headquarters_regions: string[];
  country_code?: string | null;
  continent?: string | null;
  phone_number?: string | null;
  email_address?: string | null;

  // Basic facts
  founding_year?: string | null;
  company_size?: string | null;
  revenue?: string | null;
  is_agency: boolean;
  industries: string[];
  primary_industry?: string | null;
  categories: string[];
  naics_codes: string[];

  // Status
  operating_status?: string | null;
  ipo_status?: string | null;
  company_type?: string | null;
  stock_symbol?: string | null;
  stock_exchange?: string | null;
  is_acquired: boolean;
  acquired_by_company?: string | null;
  parent_company_url?: string | null;

  // Funding
  funding_stage?: string | null;
  total_funding?: string | null;
  funds_total_formatted?: string | null;
  investors: string[];
  funding_rounds: CompanyFundingRound[];

  // People / culture
  founders: string[];
  leadership: CompanyLeader[];
  leadership_hires: CompanyKeyEvent[];
  layoffs: CompanyKeyEvent[];
  ratings: CompanyRating[];
  press_references: CompanyPressReference[];
  h1b_annual_job_counts: CompanyH1bJobCount[];
  h1b_title_distribution: CompanyH1bTitleDistribution[];

  // Products & technology
  technology_list: string[];
  tech_stack: CompanyTechnology[];
  products: CompanyProduct[];
  software_used: CompanyProduct[];
  research_focus_areas: string[];

  // Relationships
  acquisitions: CompanyAcquisition[];
  exits: CompanyExit[];
  subsidiary_list: string[];
  sub_organizations: CompanySubOrganization[];
  featured_lists: CompanyFeaturedList[];
  event_appearances: CompanyEventAppearance[];

  // Investor profile
  investor_types: string[];

  page_rank?: number | null;
}

// ── AutoApply models ─────────────────────────────────────────────────

/** A single option in a select, radio group, or checkbox group. */
export interface FieldOption {
  value: string;
  text: string;
}

/** Information about a form field discovered on an application page. */
export interface FormFieldInfo {
  field_id: string;
  /** snake_case FieldType, e.g. "text", "text_area", "select". */
  type: string;
  label: string;
  is_required: boolean;
  options: FieldOption[];
  handler_type?: string | null;
}

/** An answer to set on a specific form field. */
export interface FieldAnswer {
  field_id: string;
  /** snake_case FieldType matching the FormFieldInfo. */
  type: string;
  value?: string;
  typeahead_selection?: string | null;
  clear_first?: boolean;
  handler_type?: string | null;
}

/** A validation error displayed on the application form. */
export interface ValidationError {
  field_id?: string | null;
  message: string;
}

/** Request to start an auto-apply session. */
export interface StartAutoApplySessionRequest {
  apply_url: string;
}

/** Request to set answers for an auto-apply session. */
export interface SetAutoApplyAnswersRequest {
  session_id: string;
  answers: FieldAnswer[];
}

/** Response from an auto-apply session operation. */
export interface AutoApplySessionResponse {
  session_id: string;
  provider_id: string;
  provider_display_name: string;
  success: boolean;
  /** snake_case ApplyFlowStatus, e.g. "form_ready", "submitted". */
  status: string;
  error?: string | null;
  current_url?: string | null;
  is_terminal: boolean;
  validation_errors: ValidationError[];
  fields: FormFieldInfo[];
}

/** Request to run the full auto-apply flow against a stored profile. */
export interface RunAutoApplyRequest {
  profile_id: string;
  apply_url: string;
}

/** A single step in a full auto-apply run. */
export interface AutoApplyStepLog {
  step: number;
  action: string;
  fields_count: number;
  status: string;
  error?: string | null;
  timestamp: string;
}

/** Response from a full auto-apply run. */
export interface RunAutoApplyResponse {
  session_id: string;
  profile_id: string;
  apply_url: string;
  provider_id: string;
  provider_display_name: string;
  success: boolean;
  status: string;
  error?: string | null;
  steps_completed: number;
  fields_filled: number;
  duration_ms: number;
  step_log: AutoApplyStepLog[];
}

/** Applicant profile used by auto-apply sessions (create/update body). */
export interface AutoApplyProfileRequest {
  name?: string;

  // Personal
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  linkedin_url?: string | null;
  website_url?: string | null;
  portfolio_url?: string | null;

  // Address
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  country?: string | null;

  // Resume
  resume_text?: string | null;
  resume_file_path?: string | null;
  cover_letter_template?: string | null;

  // Work Authorization / EEO
  work_authorization?: string | null;
  requires_sponsorship?: boolean | null;
  gender?: string | null;
  ethnicity?: string | null;
  veteran_status?: string | null;
  disability_status?: string | null;

  // Salary / Availability
  desired_salary?: string | null;
  salary_expectation_currency?: string | null;
  available_start_date?: string | null;
  willing_to_relocate?: boolean | null;

  // Education
  highest_degree?: string | null;
  field_of_study?: string | null;
  university?: string | null;
  graduation_year?: string | null;

  // Experience
  years_of_experience?: string | null;
  current_job_title?: string | null;
  current_company?: string | null;

  // Custom Q&A
  custom_answers?: Record<string, string> | null;
}

/** An auto-apply profile as returned by the API. */
export interface AutoApplyProfileResponse extends AutoApplyProfileRequest {
  id: string;
  custom_answers: Record<string, string>;
  created_at: string;
  updated_at: string;
}
