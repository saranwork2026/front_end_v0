import type { ActivityStatus, Gender, Manglik, MaritalStatus } from './profile.types';

export type { ActivityStatus };

export interface SearchFilters {
  minAge?: number;
  maxAge?: number;
  gender?: Gender;
  maritalStatus?: MaritalStatus;
  motherTongue?: string;
  religion?: string;
  caste?: string;
  manglik?: Manglik;
  city?: string;
  state?: string;
  country?: string;
  education?: string;
  profession?: string;
  minAnnualIncome?: number;
  maxAnnualIncome?: number;
  minHeightCm?: number;
  maxHeightCm?: number;
  nakshatra?: string;
  raasi?: string;
  dhosam?: string;
}

export interface SearchResult {
  profileId: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: Gender;
  religion: string;
  caste: string;
  highestEducation: string;
  profession: string;
  currentCity: string;
  heightCm: number;
  primaryPhotoUrl: string | null;
  matchScore: number | null;
  /** Trust badge — true when the member's ID has been admin-verified. */
  verified?: boolean | null;
  /** Curated spotlight flag — true when admin-featured. */
  featured?: boolean | null;
  /** Coarse "last active"/online indicator. */
  activityStatus?: ActivityStatus | null;
}
