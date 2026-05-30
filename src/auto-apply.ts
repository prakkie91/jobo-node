import { HttpTransport } from "./base";
import { JoboError } from "./errors";
import type {
  AutoApplyProfileRequest,
  AutoApplyProfileResponse,
  AutoApplySessionResponse,
  FieldAnswer,
  RunAutoApplyRequest,
  RunAutoApplyResponse,
  SetAutoApplyAnswersRequest,
  StartAutoApplySessionRequest,
} from "./models";

/**
 * Sub-client for the Auto Apply endpoints (sessions and profiles).
 *
 * Access via `client.autoApply`.
 */
export class AutoApplyClient {
  /** @internal */
  constructor(private readonly http: HttpTransport) {}

  // ── Sessions ─────────────────────────────────────────────────────

  /**
   * Start a new auto-apply session for a job posting.
   *
   * @param applyUrl - The apply URL from the job listing.
   * @returns An `AutoApplySessionResponse` with session details and form fields.
   */
  async startSession(applyUrl: string): Promise<AutoApplySessionResponse> {
    const body: StartAutoApplySessionRequest = { apply_url: applyUrl };
    return this.http.post<AutoApplySessionResponse>("/api/auto-apply/start", body);
  }

  /**
   * Set answers for an active auto-apply session.
   *
   * @param sessionId - The session ID from startSession.
   * @param answers - List of field answers.
   * @returns An `AutoApplySessionResponse` with updated session state.
   */
  async setAnswers(
    sessionId: string,
    answers: FieldAnswer[]
  ): Promise<AutoApplySessionResponse> {
    const body: SetAutoApplyAnswersRequest = {
      session_id: sessionId,
      answers,
    };
    return this.http.post<AutoApplySessionResponse>("/api/auto-apply/set-answers", body);
  }

  /**
   * Run the full auto-apply flow end-to-end against a stored profile.
   *
   * @param profileId - An existing auto-apply profile ID.
   * @param applyUrl - The apply URL from the job listing.
   * @returns A `RunAutoApplyResponse` summarizing the run.
   */
  async run(profileId: string, applyUrl: string): Promise<RunAutoApplyResponse> {
    const body: RunAutoApplyRequest = { profile_id: profileId, apply_url: applyUrl };
    return this.http.post<RunAutoApplyResponse>("/api/auto-apply/run", body);
  }

  /**
   * End an auto-apply session.
   *
   * @param sessionId - The session ID to end.
   * @returns True if the session was successfully ended, false if not found.
   */
  async endSession(sessionId: string): Promise<boolean> {
    try {
      await this.http.delete(`/api/auto-apply/sessions/${sessionId}`);
      return true;
    } catch (error) {
      if (error instanceof JoboError && error.statusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  // ── Profiles ─────────────────────────────────────────────────────

  /**
   * Create a new applicant profile (POST /api/auto-apply/profiles).
   */
  async createProfile(profile: AutoApplyProfileRequest): Promise<AutoApplyProfileResponse> {
    return this.http.post<AutoApplyProfileResponse>("/api/auto-apply/profiles", profile);
  }

  /**
   * List all profiles for the authenticated user (GET /api/auto-apply/profiles).
   */
  async listProfiles(): Promise<AutoApplyProfileResponse[]> {
    return this.http.get<AutoApplyProfileResponse[]>("/api/auto-apply/profiles");
  }

  /**
   * Get a specific profile by ID (GET /api/auto-apply/profiles/{id}).
   */
  async getProfile(profileId: string): Promise<AutoApplyProfileResponse> {
    return this.http.get<AutoApplyProfileResponse>(`/api/auto-apply/profiles/${profileId}`);
  }

  /**
   * Update an existing profile (PUT /api/auto-apply/profiles/{id}).
   */
  async updateProfile(
    profileId: string,
    profile: AutoApplyProfileRequest
  ): Promise<AutoApplyProfileResponse> {
    return this.http.put<AutoApplyProfileResponse>(
      `/api/auto-apply/profiles/${profileId}`,
      profile
    );
  }

  /**
   * Delete a profile (DELETE /api/auto-apply/profiles/{id}).
   *
   * @returns True if the profile was deleted, false if not found.
   */
  async deleteProfile(profileId: string): Promise<boolean> {
    try {
      await this.http.delete(`/api/auto-apply/profiles/${profileId}`);
      return true;
    } catch (error) {
      if (error instanceof JoboError && error.statusCode === 404) {
        return false;
      }
      throw error;
    }
  }
}
