import type { PartnerPreference as ApiPartnerPreference } from '@matrimony/shared-core'
import { profileApi } from '@/src/lib/api'
import { HIGHEST_EDUCATION_OPTIONS } from '@/src/data/educationOptions'
import { RELIGIONS, MOTHER_TONGUES, CASTES_BY_RELIGION } from '@/src/data/religionCasteData'
import { PREFERRED_CITIES } from '@/src/data/cityData'

/**
 * Partner Preferences view model (spec §Partner Preferences). All fields
 * optional. "Open to all" (no-bar) toggles clear + disable the corresponding
 * MultiSelect. This maps to/from the real profileApi.getPartnerPreference /
 * savePartnerPreference (shared-core PartnerPreference DTO).
 */
export interface PartnerPreference {
  minAge?: number
  maxAge?: number
  minHeightCm?: number
  maxHeightCm?: number
  minAnnualIncome?: number
  maxAnnualIncome?: number
  manglik?: string // UI value: 'Any' | 'YES' | 'NO' | 'DONT_KNOW'
  religions: string[]
  castes: string[]
  maritalStatuses: string[]
  motherTongues: string[]
  educationCodes: string[]
  cities: string[]
  anyReligion: boolean
  /** Separate from anyReligion — matches the backend's distinct casteNoBar flag. */
  anyCaste: boolean
  anyMaritalStatus: boolean
  anyMotherTongue: boolean
  anyEducation: boolean
  anyLocation: boolean
}

export const emptyPreference: PartnerPreference = {
  manglik: 'Any',
  religions: [],
  castes: [],
  maritalStatuses: [],
  motherTongues: [],
  educationCodes: [],
  cities: [],
  anyReligion: true,
  anyCaste: true,
  anyMaritalStatus: true,
  anyMotherTongue: true,
  anyEducation: true,
  anyLocation: true,
}

// UI option lists sourced from the shared data (backend-valid values).
export const manglikPrefOptions = [
  { value: 'Any', label: 'Any' },
  { value: 'YES', label: 'Manglik' },
  { value: 'NO', label: 'Non-Manglik' },
  { value: 'DONT_KNOW', label: "Doesn't matter" },
] as const
export const religions = RELIGIONS.map((r) => r.value)
export const motherTongues = MOTHER_TONGUES.map((m) => m.value)
// Partner-preference caste is a flat, de-duped list across ALL religions
// (unlike the profile wizard where caste is scoped to the chosen religion).
// Mirrors the existing app's PartnerPreferencesPage caste list.
export const allCastes = Array.from(
  new Set(Object.values(CASTES_BY_RELIGION).flatMap((list) => list.map((c) => c.value))),
).sort((a, b) => a.localeCompare(b))
export const cities = PREFERRED_CITIES.map((c) => c.value)
export const maritalStatuses = [
  { value: 'NEVER_MARRIED', label: 'Never Married' },
  { value: 'DIVORCED', label: 'Divorced' },
  { value: 'WIDOWED', label: 'Widowed' },
]
export const educationOptions = HIGHEST_EDUCATION_OPTIONS.map((o) => ({ code: o.value, label: o.label }))

const maritalValueToLabel = new Map(maritalStatuses.map((m) => [m.value, m.label]))
export const maritalStatusValues = maritalStatuses.map((m) => m.value)
export const maritalStatusLabel = (v: string) => maritalValueToLabel.get(v) ?? v

const codeToLabel = new Map(educationOptions.map((o) => [o.code, o.label]))
export const educationLabel = (code: string) => codeToLabel.get(code) ?? code

/** Validate cross-field ranges (all fields optional). */
export function validatePreference(p: PartnerPreference): Record<string, string> {
  const errors: Record<string, string> = {}
  if (p.minAge != null && p.maxAge != null && p.minAge > p.maxAge)
    errors.maxAge = 'Max age must be greater than or equal to min age.'
  if (p.minHeightCm != null && p.maxHeightCm != null && p.minHeightCm > p.maxHeightCm)
    errors.maxHeightCm = 'Max height must be greater than or equal to min height.'
  if (p.minAnnualIncome != null && p.maxAnnualIncome != null && p.minAnnualIncome > p.maxAnnualIncome)
    errors.maxAnnualIncome = 'Max income must be greater than or equal to min income.'
  return errors
}

/* --------------------------- API mapping --------------------------- */

/** Map the view-model form → the shared-core PartnerPreference DTO. */
function toApi(p: PartnerPreference): ApiPartnerPreference {
  const manglik = p.manglik && p.manglik !== 'Any' ? p.manglik : undefined
  return {
    minAge: p.minAge,
    maxAge: p.maxAge,
    minHeightCm: p.minHeightCm,
    maxHeightCm: p.maxHeightCm,
    minAnnualIncome: p.minAnnualIncome,
    maxAnnualIncome: p.maxAnnualIncome,
    manglikPreference: manglik,
    religionNoBar: p.anyReligion,
    casteNoBar: p.anyCaste, // distinct from religionNoBar (backend has both)
    preferredReligions: p.anyReligion ? [] : p.religions,
    preferredCastes: p.anyCaste ? [] : p.castes,
    preferredMaritalStatuses: p.anyMaritalStatus ? [] : p.maritalStatuses,
    preferredMotherTongues: p.anyMotherTongue ? [] : p.motherTongues,
    preferredEducations: p.anyEducation ? [] : p.educationCodes,
    preferredCities: p.anyLocation ? [] : p.cities,
  }
}

/** Map the DTO → the view-model form (for seeding the page). */
function fromApi(d: ApiPartnerPreference): PartnerPreference {
  const religions = d.preferredReligions ?? []
  const castes = d.preferredCastes ?? []
  const maritalStatuses = d.preferredMaritalStatuses ?? []
  const motherTongues = d.preferredMotherTongues ?? []
  const educationCodes = d.preferredEducations ?? []
  const cityList = d.preferredCities ?? []
  return {
    minAge: d.minAge,
    maxAge: d.maxAge,
    minHeightCm: d.minHeightCm,
    maxHeightCm: d.maxHeightCm,
    minAnnualIncome: d.minAnnualIncome,
    maxAnnualIncome: d.maxAnnualIncome,
    manglik: d.manglikPreference ?? 'Any',
    religions,
    castes,
    maritalStatuses,
    motherTongues,
    educationCodes,
    cities: cityList,
    anyReligion: d.religionNoBar ?? religions.length === 0,
    anyCaste: d.casteNoBar ?? castes.length === 0,
    anyMaritalStatus: maritalStatuses.length === 0,
    anyMotherTongue: motherTongues.length === 0,
    anyEducation: educationCodes.length === 0,
    anyLocation: cityList.length === 0,
  }
}

export async function getPartnerPreference(): Promise<PartnerPreference> {
  const res = await profileApi.getPartnerPreference()
  return fromApi(res.data)
}

export async function savePartnerPreference(p: PartnerPreference): Promise<void> {
  await profileApi.savePartnerPreference(toApi(p))
}
