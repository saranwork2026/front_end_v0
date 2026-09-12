// Enums
export type Gender = 'MALE' | 'FEMALE';
export type MaritalStatus = 'NEVER_MARRIED' | 'DIVORCED' | 'WIDOWED';
export type Manglik = 'YES' | 'NO' | 'DONT_KNOW';
export type EmploymentType = 'EMPLOYED_PRIVATE' | 'EMPLOYED_GOVT' | 'SELF_EMPLOYED' | 'BUSINESS' | 'FREELANCER' | 'NOT_WORKING';
export type ResidencyStatus = 'CITIZEN' | 'PERMANENT_RESIDENT' | 'WORK_PERMIT' | 'STUDENT_VISA' | 'TEMPORARY_VISA';
export type BloodGroup = 'A_POSITIVE' | 'A_NEGATIVE' | 'B_POSITIVE' | 'B_NEGATIVE' | 'O_POSITIVE' | 'O_NEGATIVE' | 'AB_POSITIVE' | 'AB_NEGATIVE' | 'DONT_KNOW';
export type Complexion = 'VERY_FAIR' | 'FAIR' | 'WHEATISH' | 'WHEATISH_BROWN' | 'DARK';
export type BodyType = 'SLIM' | 'AVERAGE' | 'ATHLETIC' | 'HEAVY';
export type PhysicalStatus = 'NORMAL' | 'PHYSICALLY_CHALLENGED';
export type FamilyType = 'NUCLEAR' | 'JOINT' | 'EXTENDED';
export type FamilyStatus = 'MIDDLE_CLASS' | 'UPPER_MIDDLE_CLASS' | 'RICH' | 'AFFLUENT';
export type Dhosam = 'NONE' | 'SEVVAI' | 'RAHU' | 'KETHU' | 'SHANI' | 'KALATHRA';
export type ProfileStatus = 'DRAFT' | 'COMPLETED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
export type VisibilityLevel = 'PUBLIC' | 'PREMIUM_ONLY' | 'REQUEST_REQUIRED';

/** The seven profile sections that count toward completion (matches backend ProfileSection). */
export type ProfileSection =
  | 'BASIC'
  | 'LOCATION'
  | 'RELIGIOUS'
  | 'PROFESSIONAL'
  | 'PHYSICAL'
  | 'FAMILY'
  | 'HOROSCOPE';

/**
 * Actionable profile-strength breakdown (owner's own profile only). Lets the
 * UI render specific "add your X" nudges. Derived on the backend from the same
 * checks as the completion percentage.
 */
export interface ProfileStrength {
  completionPct: number;
  completed: boolean;
  missingSections: ProfileSection[];
}
/**
 * Coarse, privacy-bucketed "last active"/online indicator (never an exact
 * timestamp). Mirrors the backend ActivityStatus enum. UNKNOWN when there's no
 * activity recorded or the member chose to appear offline.
 */
export type ActivityStatus =
  | 'ONLINE_NOW'
  | 'ACTIVE_TODAY'
  | 'ACTIVE_THIS_WEEK'
  | 'ACTIVE_RECENTLY'
  | 'UNKNOWN';

// Full UserProfile interface
export interface UserProfile {
  userId: string;
  profileId: string;
  firstName: string;
  lastName: string;
  /** Account created (registration) timestamp — populated on the owner's own
   *  profile and the admin user-detail view. ISO-8601 string. */
  createdAt?: string | null;
  /** Most recent successful login. Null if never logged in. ISO-8601 string. */
  lastLoginAt?: string | null;
  // Basic
  dateOfBirth: string;
  age: number;
  gender: Gender;
  maritalStatus: MaritalStatus;
  motherTongue: string;
  aboutMe: string;
  status: ProfileStatus;
  profileCompleted: boolean;
  profileCompletionPct: number;
  /** Actionable profile-strength breakdown (owner's own profile only). */
  profileStrength?: ProfileStrength | null;
  /** Trust badge — true when the member's ID has been admin-verified. */
  verified?: boolean | null;
  /** Coarse "last active"/online indicator (set when viewing another member). */
  activityStatus?: ActivityStatus | null;
  photoVisibility: VisibilityLevel;
  contactVisibility: VisibilityLevel;
  // Religious
  religion: string;
  sect: string;
  caste: string;
  subCaste: string;
  gothram: string;
  manglik: Manglik;
  canConsiderOtherReligion: boolean;
  canConsiderOtherCaste: boolean;
  // Professional
  highestEducation: string;
  educationDetail: string;
  employmentType: EmploymentType;
  profession: string;
  companyName: string;
  annualIncome: number;
  workLocation: string;
  // Location
  currentCity: string;
  currentState: string;
  currentCountry: string;
  nativeCity: string;
  nativeState: string;
  nativeCountry: string;
  citizenshipCountry: string;
  residencyStatus: ResidencyStatus;
  // Physical
  heightCm: number;
  weightKg: number;
  bloodGroup: BloodGroup;
  complexion: Complexion;
  bodyType: BodyType;
  physicalStatus: PhysicalStatus;
  // Family
  fatherStatus: string;
  fatherProfession: string;
  motherStatus: string;
  motherProfession: string | null;
  noOfBrothers: number;
  brothersMarried: number;
  noOfSisters: number;
  sistersMarried: number;
  familyType: FamilyType;
  familyStatus: FamilyStatus;
  assetDetails: string;
  birthOrder: string | null;
  ownHouse: boolean;
  nativePlace: string;
  // Horoscope
  raasi: string;
  nakshatra: string;
  dhosam: Dhosam;
  lagnam: string;
  birthTime: string;
  birthCity: string;
  horoscopeAvailable: boolean;
  willingToShareHoroscope: boolean;
  tamilYear: string | null;
  tamilMonth: string | null;
  tamilDate: string | null;
  kilamai: string | null;
  birthPlaceLabel: string | null;
  birthLatitude: number | null;
  birthLongitude: number | null;
  birthTimezone: string | null;
  padam: number | null;
  // Computed
  matchScore: number | null;
}

// Section-specific request types
export interface BasicSectionRequest {
  dateOfBirth: string;
  gender: Gender;
  maritalStatus: MaritalStatus;
  motherTongue?: string;
  aboutMe?: string;
  photoVisibility?: VisibilityLevel;
  contactVisibility?: VisibilityLevel;
}

export interface ReligiousSectionRequest {
  religion?: string;
  sect?: string;
  caste?: string;
  subCaste?: string;
  gothram?: string;
  manglik?: Manglik;
  canConsiderOtherReligion?: boolean;
  canConsiderOtherCaste?: boolean;
}

export interface ProfessionalSectionRequest {
  highestEducation?: string;
  educationDetail?: string;
  employmentType?: EmploymentType;
  profession?: string;
  companyName?: string;
  annualIncome?: number;
  workLocation?: string;
}

export interface LocationSectionRequest {
  currentCity?: string;
  currentState?: string;
  currentCountry?: string;
  nativeCity?: string;
  nativeState?: string;
  nativeCountry?: string;
  citizenshipCountry?: string;
  residencyStatus?: ResidencyStatus;
}

export interface PhysicalSectionRequest {
  heightCm?: number;
  weightKg?: number;
  bloodGroup?: BloodGroup;
  complexion?: Complexion;
  bodyType?: BodyType;
  physicalStatus?: PhysicalStatus;
}

export type ParentStatus = 'EMPLOYED' | 'BUSINESS' | 'RETIRED' | 'HOMEMAKER' | 'PASSED_AWAY';

export interface FamilySectionRequest {
  fatherStatus?: ParentStatus;
  fatherProfession?: string;
  motherStatus?: ParentStatus;
  motherProfession?: string;
  noOfBrothers?: number;
  brothersMarried?: number;
  noOfSisters?: number;
  sistersMarried?: number;
  familyType?: FamilyType;
  familyStatus?: FamilyStatus;
  assetDetails?: string;
  birthOrder?: string;
  ownHouse?: boolean;
  nativePlace?: string;
}

export interface HoroscopeSectionRequest {
  raasi?: string;
  nakshatra?: string;
  dhosam?: Dhosam;
  lagnam?: string;
  birthTime?: string;
  birthCity?: string;
  horoscopeAvailable?: boolean;
  willingToShareHoroscope?: boolean;
  tamilYear?: string;
  tamilMonth?: string;
  tamilDate?: string;
  kilamai?: string;
  birthPlaceLabel?: string;
  birthLatitude?: number;
  birthLongitude?: number;
  birthTimezone?: string;
  padam?: number;
}

/** Suggested Tamil-calendar values derived from a DOB (GET .../tamil-calendar). */
export interface TamilCalendarSuggestion {
  tamilYear: string;
  tamilMonth: string;
  tamilDate: string;
  kilamai: string;
}

// ==================== Horoscope charts (Spec 2) ====================

/** Graha codes as returned/stored by the backend chart JSON. */
export type Graha =
  | 'SUN' | 'MOON' | 'MARS' | 'MERCURY' | 'JUPITER'
  | 'VENUS' | 'SATURN' | 'RAHU' | 'KETU' | 'LAGNA';

/** Tamil chart abbreviations for each graha (as printed on a jathagam). */
export const GRAHA_TAMIL: Record<Graha, string> = {
  SUN: 'சூ', MOON: 'சந்', MARS: 'செ', MERCURY: 'பு', JUPITER: 'கு',
  VENUS: 'சு', SATURN: 'சனி', RAHU: 'ரா', KETU: 'கே', LAGNA: 'ல',
};

export type ChartType = 'RASI' | 'NAVAMSA';

/** The 12 zodiac sign keys, fixed order (index 0 = Mesha). */
export const CHART_SIGNS = [
  'MESHA', 'RISHABHA', 'MITHUNA', 'KATAKA', 'SIMHA', 'KANYA',
  'TULA', 'VRISCHIKA', 'DHANUS', 'MAKARA', 'KUMBHA', 'MEENA',
] as const;

export type ChartSign = (typeof CHART_SIGNS)[number];

/** One divisional chart: sign key -> grahas occupying that sign. */
export interface ChartData {
  chartType: ChartType;
  placements: Record<string, Graha[]>;
}

/** Request to generate charts (all required; guard rejects if incomplete). */
export interface GenerateChartRequest {
  dateOfBirth: string; // YYYY-MM-DD
  birthTime: string;   // HH:mm
  latitude: number;
  longitude: number;
  timezone: string;    // IANA id, e.g. "Asia/Kolkata"
  placeLabel?: string;
}

/** Generated charts + panchangam suggestions (nothing persisted yet). */
export interface GenerateChartResponse {
  rasiChart: ChartData;
  navamsaChart: ChartData;
  nakshatra: string;
  padam: number;
  raasi: string;
  lagnam: string;
}

/** Persist the (possibly edited) charts. */
export interface ConfirmChartRequest {
  rasiChart: ChartData;
  navamsaChart: ChartData;
  edited: boolean;
}
