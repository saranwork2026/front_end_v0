import type { AxiosInstance, AxiosResponse } from 'axios';
import type {
  UserProfile,
  BasicSectionRequest,
  ReligiousSectionRequest,
  ProfessionalSectionRequest,
  LocationSectionRequest,
  PhysicalSectionRequest,
  FamilySectionRequest,
  HoroscopeSectionRequest,
  TamilCalendarSuggestion,
  GenerateChartRequest,
  GenerateChartResponse,
  ConfirmChartRequest,
  ChartData,
} from '../types/profile.types';

/**
 * The backend's GET /user/profile response groups fields by section
 * (basic, religious, professional, location, physical, family, horoscope —
 * see UserProfileResponse.java) instead of returning them flat. The rest of
 * the frontend (UserProfile type, ProfileViewPage, ProfileWizardPage,
 * DashboardPage) expects a flat shape, so we flatten it once here at the API
 * boundary rather than teaching every consumer about the nested structure.
 */
interface ProfileApiResponse {
  userId: string;
  profileId: string;
  firstName: string;
  lastName: string;
  age: number;
  status: UserProfile['status'];
  profileCompleted: boolean;
  profileCompletionPct: number;
  matchScore?: number | null;
  contactVisible?: boolean;
  photosVisible?: boolean;
  basic?: Record<string, unknown>;
  religious?: Record<string, unknown>;
  professional?: Record<string, unknown>;
  location?: Record<string, unknown>;
  physical?: Record<string, unknown>;
  family?: Record<string, unknown>;
  horoscope?: Record<string, unknown>;
}

function flattenProfileResponse(data: ProfileApiResponse): UserProfile {
  const { basic, religious, professional, location, physical, family, horoscope, ...rest } = data;
  return {
    ...rest,
    ...basic,
    ...religious,
    ...professional,
    ...location,
    ...physical,
    ...family,
    ...horoscope,
  } as UserProfile;
}

export interface PartnerPreference {
  userId?: string;
  minAge?: number;
  maxAge?: number;
  minHeightCm?: number;
  maxHeightCm?: number;
  minAnnualIncome?: number;
  maxAnnualIncome?: number;
  manglikPreference?: string;
  religionNoBar?: boolean;
  casteNoBar?: boolean;
  preferredReligions?: string[];
  preferredCastes?: string[];
  preferredCities?: string[];
  preferredEducations?: string[];
  preferredMaritalStatuses?: string[];
  preferredMotherTongues?: string[];
}

export function createProfileApi(client: AxiosInstance) {
  return {
    async getProfile(): Promise<AxiosResponse<UserProfile>> {
      const response = await client.get<ProfileApiResponse>('/user/profile');
      return { ...response, data: flattenProfileResponse(response.data) };
    },

    async getProfileById(profileId: string): Promise<AxiosResponse<UserProfile>> {
      const response = await client.get<ProfileApiResponse>(`/user/profile/${profileId}`);
      return { ...response, data: flattenProfileResponse(response.data) };
    },

    saveBasic(data: BasicSectionRequest) {
      return client.post<{ message: string }>('/user/profile/basic', data);
    },

    saveReligious(data: ReligiousSectionRequest) {
      return client.post<{ message: string }>('/user/profile/religious', data);
    },

    saveProfessional(data: ProfessionalSectionRequest) {
      return client.post<{ message: string }>('/user/profile/professional', data);
    },

    saveLocation(data: LocationSectionRequest) {
      return client.post<{ message: string }>('/user/profile/location', data);
    },

    savePhysical(data: PhysicalSectionRequest) {
      return client.post<{ message: string }>('/user/profile/physical', data);
    },

    saveFamily(data: FamilySectionRequest) {
      return client.post<{ message: string }>('/user/profile/family', data);
    },

    saveHoroscope(data: HoroscopeSectionRequest) {
      return client.post<{ message: string }>('/user/profile/horoscope', data);
    },

    /**
     * Derive Tamil-calendar coordinates (year/month/date/weekday) from a
     * Gregorian DOB (YYYY-MM-DD) to pre-fill the Horoscope dropdowns. The Tamil
     * calendar is solar, so the date alone is enough — no birth time/place.
     * Suggestions only; the member may override before saving.
     */
    getTamilCalendar(dob: string) {
      return client.get<TamilCalendarSuggestion>('/user/profile/horoscope/tamil-calendar', {
        params: { dob },
      });
    },

    // ---- Digital Raasi/Amsam chart generation (Spec 2) ----

    /**
     * Compute suggested D1/D9 charts + panchangam from birth date/time/place.
     * Suggestions only — persists nothing. Backend returns 422 if birth time or
     * place is missing.
     */
    generateHoroscopeChart(data: GenerateChartRequest) {
      return client.post<GenerateChartResponse>('/user/horoscope/chart/generate', data);
    },

    /** Persist the (possibly member-edited) charts. */
    confirmHoroscopeChart(data: ConfirmChartRequest) {
      return client.post<{ message: string }>('/user/horoscope/chart/confirm', data);
    },

    /** The member's own stored charts. */
    getHoroscopeCharts() {
      return client.get<ChartData[]>('/user/horoscope/chart');
    },

    /** Another member's charts (visibility-gated server-side). */
    getHoroscopeChartsForProfile(profileId: string) {
      return client.get<ChartData[]>(`/user/horoscope/chart/${profileId}`);
    },

    /**
     * Explicit "submit for review" — moves the profile to COMPLETED so it
     * enters the admin moderation queue immediately, independent of the
     * completion-percentage side-effect and of plan selection. Called from the
     * wizard's final step.
     */
    submitProfile() {
      return client.post<{ message: string }>('/user/profile/submit');
    },

    getPartnerPreference() {
      return client.get<PartnerPreference>('/user/partnerpreference');
    },

    savePartnerPreference(data: PartnerPreference) {
      return client.post<PartnerPreference>('/user/partnerpreference', data);
    },
  };
}
