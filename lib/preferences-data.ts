import type { Gender, PartnerPreference as ApiPartnerPreference } from '@matrimony/shared-core'
import { profileApi } from '@/src/lib/api'
import { HIGHEST_EDUCATION_OPTIONS } from '@/src/data/educationOptions'
import { RELIGIONS, MOTHER_TONGUES, CASTES_BY_RELIGION } from '@/src/data/religionCasteData'
import { PREFERRED_CITIES } from '@/src/data/cityData'
import { INDIAN_STATES } from '@/src/data/indianStatesData'
import { COUNTRIES } from '@/src/data/countryData'
import { NAKSHATRA_OPTIONS, RAASI_OPTIONS } from '@/src/data/horoscopeData'
import { OCCUPATIONS } from '@/src/data/occupationData'
import {
  DEFAULT_COUNTRY,
  DEFAULT_DHOSAM,
  DEFAULT_MANGLIK,
  DEFAULT_MARITAL_STATUS,
  DEFAULT_MIN_HEIGHT_CM,
  DEFAULT_MOTHER_TONGUE,
  DEFAULT_PHYSICAL_STATUS,
  DEFAULT_RELIGION,
  DEFAULT_STATE,
  PHYSICAL_STATUS_OPTIONS,
  defaultMinAge,
} from '@/src/data/preferenceDefaults'

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
  // --- Phase 2: parity with search filters ---
  states: string[]
  countries: string[]
  professions: string[]
  nakshatras: string[]
  raasis: string[]
  dhosams: string[]
  physicalStatuses: string[]
  anyReligion: boolean
  /** Separate from anyReligion — matches the backend's distinct casteNoBar flag. */
  anyCaste: boolean
  anyMaritalStatus: boolean
  anyMotherTongue: boolean
  anyEducation: boolean
  anyLocation: boolean
  // Phase 2 "open to all" toggles (empty array = open to all, mirroring the others)
  anyState: boolean
  anyCountry: boolean
  anyProfession: boolean
  anyNakshatra: boolean
  anyRaasi: boolean
  anyDhosam: boolean
  anyPhysicalStatus: boolean
}

export const emptyPreference: PartnerPreference = {
  manglik: 'Any',
  religions: [],
  castes: [],
  maritalStatuses: [],
  motherTongues: [],
  educationCodes: [],
  cities: [],
  states: [],
  countries: [],
  professions: [],
  nakshatras: [],
  raasis: [],
  dhosams: [],
  physicalStatuses: [],
  anyReligion: true,
  anyCaste: true,
  anyMaritalStatus: true,
  anyMotherTongue: true,
  anyEducation: true,
  anyLocation: true,
  anyState: true,
  anyCountry: true,
  anyProfession: true,
  anyNakshatra: true,
  anyRaasi: true,
  anyDhosam: true,
  anyPhysicalStatus: true,
}

/**
 * The agreed first-load defaults for Partner Preferences (shared in spirit with
 * Search — see src/data/preferenceDefaults.ts). Applied only when the member
 * has NO saved preference yet; everything stays editable.
 *
 * Phase 1 covers the fields the preferences backend already supports:
 * age (18 male / 21 female floor), height (147 cm floor), marital
 * (Never Married), mother tongue (Tamil), religion (Hindu), manglik (No).
 * State / country / profession / horoscope / physical-status preferences are
 * Phase 2 adds the remaining parity fields to the backend, so the full set of
 * agreed defaults now applies here: country India, state Tamil Nadu, physical
 * status Normal, dhosam None (nakshatra/raasi/profession left open-to-all).
 */
export function defaultPreference(gender?: Gender | null): PartnerPreference {
  return {
    ...emptyPreference,
    minAge: defaultMinAge(gender),
    minHeightCm: DEFAULT_MIN_HEIGHT_CM,
    manglik: DEFAULT_MANGLIK, // 'NO'
    religions: [DEFAULT_RELIGION], // ['Hindu']
    maritalStatuses: [DEFAULT_MARITAL_STATUS], // ['NEVER_MARRIED']
    motherTongues: [DEFAULT_MOTHER_TONGUE], // ['Tamil']
    states: [DEFAULT_STATE], // ['Tamil Nadu']
    countries: [DEFAULT_COUNTRY], // ['India']
    physicalStatuses: [DEFAULT_PHYSICAL_STATUS], // ['NORMAL']
    dhosams: [DEFAULT_DHOSAM], // ['NONE']
    // No-bar toggles OFF for the fields we default (so the chosen values apply);
    // everything else inherits emptyPreference's open-to-all = true.
    anyReligion: false,
    anyMaritalStatus: false,
    anyMotherTongue: false,
    anyState: false,
    anyCountry: false,
    anyPhysicalStatus: false,
    anyDhosam: false,
  }
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

// --- Phase 2 option lists (parity with search), sourced from shared data. ---
export const stateOptions = INDIAN_STATES.map((s) => s.value)
export const countryOptions = COUNTRIES.map((c) => c.value)
export const nakshatraOptions = NAKSHATRA_OPTIONS.map((n) => ({ value: n.value, label: n.label }))
export const raasiOptions = RAASI_OPTIONS.map((r) => ({ value: r.value, label: r.label }))
export const dhosamPrefOptions = [
  { value: 'NONE', label: 'No Dhosam' },
  { value: 'SEVVAI', label: 'Sevvai (Chevvai)' },
  { value: 'RAHU', label: 'Rahu' },
  { value: 'KETHU', label: 'Kethu' },
  { value: 'SHANI', label: 'Shani' },
  { value: 'KALATHRA', label: 'Kalathra' },
]
export const physicalStatusPrefOptions = PHYSICAL_STATUS_OPTIONS.map((p) => ({ value: p.value, label: p.label }))
export const professionOptions = OCCUPATIONS.map((o) => ({ value: o.value, label: o.label }))

const maritalValueToLabel = new Map(maritalStatuses.map((m) => [m.value, m.label]))
export const maritalStatusValues = maritalStatuses.map((m) => m.value)
export const maritalStatusLabel = (v: string) => maritalValueToLabel.get(v) ?? v

const codeToLabel = new Map(educationOptions.map((o) => [o.code, o.label]))
export const educationLabel = (code: string) => codeToLabel.get(code) ?? code

/**
 * Validate cross-field ranges + per-list caps. New-FE keeps the "leave blank =
 * no limit" optional UX (so we don't force the shared partnerPreferenceSchema,
 * which requires every numeric field), but we mirror its meaningful rules:
 * min<=max ordering (age/height/income) and the max-20-items cap per multiselect.
 */
const MAX_PREF_ITEMS = 20
const TOO_MANY = `You can select at most ${MAX_PREF_ITEMS} options.`

export function validatePreference(p: PartnerPreference): Record<string, string> {
  const errors: Record<string, string> = {}
  if (p.minAge != null && p.maxAge != null && p.minAge > p.maxAge)
    errors.maxAge = 'Max age must be greater than or equal to min age.'
  if (p.minHeightCm != null && p.maxHeightCm != null && p.minHeightCm > p.maxHeightCm)
    errors.maxHeightCm = 'Max height must be greater than or equal to min height.'
  if (p.minAnnualIncome != null && p.maxAnnualIncome != null && p.minAnnualIncome > p.maxAnnualIncome)
    errors.maxAnnualIncome = 'Max income must be greater than or equal to min income.'
  // Per-list caps (partnerPreferenceSchema enforces max 20 on each array).
  if (p.religions.length > MAX_PREF_ITEMS) errors.religions = TOO_MANY
  if (p.castes.length > MAX_PREF_ITEMS) errors.castes = TOO_MANY
  if (p.maritalStatuses.length > MAX_PREF_ITEMS) errors.maritalStatuses = TOO_MANY
  if (p.motherTongues.length > MAX_PREF_ITEMS) errors.motherTongues = TOO_MANY
  if (p.educationCodes.length > MAX_PREF_ITEMS) errors.educationCodes = TOO_MANY
  if (p.cities.length > MAX_PREF_ITEMS) errors.cities = TOO_MANY
  if (p.states.length > MAX_PREF_ITEMS) errors.states = TOO_MANY
  if (p.countries.length > MAX_PREF_ITEMS) errors.countries = TOO_MANY
  if (p.professions.length > MAX_PREF_ITEMS) errors.professions = TOO_MANY
  if (p.nakshatras.length > MAX_PREF_ITEMS) errors.nakshatras = TOO_MANY
  if (p.raasis.length > MAX_PREF_ITEMS) errors.raasis = TOO_MANY
  if (p.dhosams.length > MAX_PREF_ITEMS) errors.dhosams = TOO_MANY
  if (p.physicalStatuses.length > MAX_PREF_ITEMS) errors.physicalStatuses = TOO_MANY
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
    // Phase 2 parity fields
    preferredStates: p.anyState ? [] : p.states,
    preferredCountries: p.anyCountry ? [] : p.countries,
    preferredProfessions: p.anyProfession ? [] : p.professions,
    preferredNakshatras: p.anyNakshatra ? [] : p.nakshatras,
    preferredRaasis: p.anyRaasi ? [] : p.raasis,
    preferredDhosams: p.anyDhosam ? [] : p.dhosams,
    preferredPhysicalStatuses: p.anyPhysicalStatus ? [] : p.physicalStatuses,
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
  const states = d.preferredStates ?? []
  const countries = d.preferredCountries ?? []
  const professions = d.preferredProfessions ?? []
  const nakshatras = d.preferredNakshatras ?? []
  const raasis = d.preferredRaasis ?? []
  const dhosams = d.preferredDhosams ?? []
  const physicalStatuses = d.preferredPhysicalStatuses ?? []
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
    states,
    countries,
    professions,
    nakshatras,
    raasis,
    dhosams,
    physicalStatuses,
    anyReligion: d.religionNoBar ?? religions.length === 0,
    anyCaste: d.casteNoBar ?? castes.length === 0,
    anyMaritalStatus: maritalStatuses.length === 0,
    anyMotherTongue: motherTongues.length === 0,
    anyEducation: educationCodes.length === 0,
    anyLocation: cityList.length === 0,
    anyState: states.length === 0,
    anyCountry: countries.length === 0,
    anyProfession: professions.length === 0,
    anyNakshatra: nakshatras.length === 0,
    anyRaasi: raasis.length === 0,
    anyDhosam: dhosams.length === 0,
    anyPhysicalStatus: physicalStatuses.length === 0,
  }
}

export async function getPartnerPreference(): Promise<PartnerPreference> {
  const res = await profileApi.getPartnerPreference()
  return fromApi(res.data)
}

export async function savePartnerPreference(p: PartnerPreference): Promise<void> {
  await profileApi.savePartnerPreference(toApi(p))
}
