/**
 * Shared occupation / profession vocabulary used by the Search profession
 * filter (single-select) and the Partner Preferences profession field
 * (multi-select), so both draw from one canonical list — the same rationale
 * as religionCasteData.ts / horoscopeData.ts (frontend-only reference data; the
 * backend `profession` field stays a plain String).
 *
 * NOTE: the profile wizard currently captures profession as a free-text input,
 * so filtering by these values is an exact match against whatever was typed.
 * Aligning the wizard to this same list (so stored values always match) is a
 * separate, follow-up profile-UI change.
 *
 * `value` is what we store/match on; keep values stable. Grouped loosely by
 * sector for readability only (order doesn't matter to consumers).
 */

export interface OccupationOption {
  value: string
  label: string
}

export const OCCUPATIONS: OccupationOption[] = [
  // Software / IT
  { value: 'Software Professional', label: 'Software Professional' },
  { value: 'IT / Data Professional', label: 'IT / Data Professional' },
  // Engineering
  { value: 'Engineer - Non IT', label: 'Engineer (Non-IT)' },
  { value: 'Architect', label: 'Architect' },
  // Medical
  { value: 'Doctor', label: 'Doctor' },
  { value: 'Nurse', label: 'Nurse' },
  { value: 'Pharmacist', label: 'Pharmacist' },
  { value: 'Paramedical', label: 'Paramedical / Healthcare' },
  // Finance / Business
  { value: 'Accountant', label: 'Accountant' },
  { value: 'Chartered Accountant', label: 'Chartered Accountant (CA)' },
  { value: 'Banking Professional', label: 'Banking / Finance Professional' },
  { value: 'Business Owner', label: 'Business Owner / Entrepreneur' },
  // Government / Defence
  { value: 'Government Employee', label: 'Government Employee' },
  { value: 'Civil Services', label: 'Civil Services (IAS/IPS/IFS)' },
  { value: 'Defence', label: 'Defence / Armed Forces' },
  { value: 'Police', label: 'Police' },
  // Law / Education
  { value: 'Lawyer', label: 'Lawyer / Legal Professional' },
  { value: 'Teacher', label: 'Teacher' },
  { value: 'Professor / Lecturer', label: 'Professor / Lecturer' },
  { value: 'Research Professional', label: 'Research Professional' },
  // Creative / Media
  { value: 'Designer', label: 'Designer' },
  { value: 'Media Professional', label: 'Media / Journalism' },
  { value: 'Artist', label: 'Artist / Performer' },
  // Services / Other
  { value: 'Civil Aviation', label: 'Civil Aviation (Pilot / Cabin Crew)' },
  { value: 'Merchant Navy', label: 'Merchant Navy' },
  { value: 'Hospitality Professional', label: 'Hospitality / Travel' },
  { value: 'Sales / Marketing', label: 'Sales / Marketing' },
  { value: 'Administration', label: 'Administration / HR' },
  { value: 'Agriculture', label: 'Agriculture / Farming' },
  { value: 'Self Employed', label: 'Self Employed' },
  { value: 'Not Working', label: 'Not Working' },
  { value: 'Other', label: 'Other' },
]
