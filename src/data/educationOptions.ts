/**
 * Highest Education reference data — FRONTEND ONLY enum, same rationale as
 * religionCasteData.ts (no backend enum/DB lookup table; ships in the JS
 * bundle since the list changes rarely).
 *
 * Uses Indian schooling terminology (SSLC/HSC) per user request, while
 * staying compatible with the existing values already used in
 * PartnerPreferencesPage's "Preferred Educations" multi-select — both
 * profile.highestEducation (this list) and partner preference's
 * preferredEducations must use the same value strings, since
 * MatchEngineService does plain string containment matching between them.
 */

export interface EducationOption {
  value: string;
  label: string;
}

export const HIGHEST_EDUCATION_OPTIONS: EducationOption[] = [
  { value: 'SSLC', label: 'SSLC / 10th' },
  { value: 'HSC', label: 'HSC / 12th' },
  { value: 'Diploma', label: 'Diploma' },
  { value: 'Bachelor', label: "Bachelor's Degree" },
  { value: 'Master', label: "Master's Degree" },
  { value: 'Doctorate', label: 'Doctorate (Ph.D)' },
  { value: 'Professional', label: 'Professional Degree (MD, CA, etc.)' },
  { value: 'Other', label: 'Other' },
];
