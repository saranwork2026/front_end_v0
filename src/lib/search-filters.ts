import type { Gender, SearchFilters } from '@matrimony/shared-core'
import { HIGHEST_EDUCATION_OPTIONS } from '@/src/data/educationOptions'
import {
  DEFAULT_COUNTRY,
  DEFAULT_MANGLIK,
  DEFAULT_MARITAL_STATUS,
  DEFAULT_MIN_HEIGHT_CM,
  DEFAULT_MOTHER_TONGUE,
  DEFAULT_PHYSICAL_STATUS,
  DEFAULT_RELIGION,
  DEFAULT_STATE,
  defaultMinAge,
} from '@/src/data/preferenceDefaults'

/**
 * The agreed first-load defaults for Search, shared in spirit with Partner
 * Preferences (see preferenceDefaults.ts). Applied only when the user hasn't
 * set filters yet; every value remains editable/clearable.
 */
export function defaultSearchFilters(gender?: Gender | null): SearchFilters {
  return {
    minAge: defaultMinAge(gender),
    minHeightCm: DEFAULT_MIN_HEIGHT_CM,
    maritalStatus: DEFAULT_MARITAL_STATUS,
    motherTongue: DEFAULT_MOTHER_TONGUE,
    religion: DEFAULT_RELIGION,
    manglik: DEFAULT_MANGLIK,
    country: DEFAULT_COUNTRY,
    state: DEFAULT_STATE,
    physicalStatus: DEFAULT_PHYSICAL_STATUS,
  }
}

/** Active-filter chip keys (grouped ranges collapse to one chip). */
export type ChipKey = keyof SearchFilters | 'age' | 'income' | 'height'

export interface ActiveChip {
  key: ChipKey
  label: string
}

const MARITAL_LABEL: Record<string, string> = {
  NEVER_MARRIED: 'Never Married',
  DIVORCED: 'Divorced',
  WIDOWED: 'Widowed',
}
const MANGLIK_LABEL: Record<string, string> = { YES: 'Manglik: Yes', NO: 'Manglik: No', DONT_KNOW: "Manglik: Don't know" }
const PHYSICAL_STATUS_LABEL: Record<string, string> = { NORMAL: 'Normal', PHYSICALLY_CHALLENGED: 'Physically Challenged' }

function educationLabel(code?: string): string {
  if (!code) return ''
  return HIGHEST_EDUCATION_OPTIONS.find((e) => e.value === code)?.label ?? code
}

export function buildActiveChips(f: SearchFilters): ActiveChip[] {
  const chips: ActiveChip[] = []
  if (f.minAge || f.maxAge) chips.push({ key: 'age', label: `Age ${f.minAge ?? 18}–${f.maxAge ?? 60}` })
  if (f.maritalStatus) chips.push({ key: 'maritalStatus', label: MARITAL_LABEL[f.maritalStatus] ?? f.maritalStatus })
  if (f.motherTongue) chips.push({ key: 'motherTongue', label: f.motherTongue })
  if (f.religion) chips.push({ key: 'religion', label: f.religion })
  if (f.caste) chips.push({ key: 'caste', label: f.caste })
  if (f.manglik) chips.push({ key: 'manglik', label: MANGLIK_LABEL[f.manglik] ?? f.manglik })
  if (f.country) chips.push({ key: 'country', label: f.country })
  if (f.state) chips.push({ key: 'state', label: f.state })
  if (f.city) chips.push({ key: 'city', label: f.city })
  if (f.education) chips.push({ key: 'education', label: educationLabel(f.education) })
  if (f.profession) chips.push({ key: 'profession', label: f.profession })
  if (f.minAnnualIncome || f.maxAnnualIncome)
    chips.push({ key: 'income', label: `₹${f.minAnnualIncome ?? 0}–${f.maxAnnualIncome ?? '∞'}` })
  if (f.minHeightCm || f.maxHeightCm)
    chips.push({ key: 'height', label: `${f.minHeightCm ?? 'any'}–${f.maxHeightCm ?? 'any'} cm` })
  if (f.nakshatra) chips.push({ key: 'nakshatra', label: f.nakshatra })
  if (f.raasi) chips.push({ key: 'raasi', label: f.raasi })
  if (f.dhosam) chips.push({ key: 'dhosam', label: `Dhosam: ${f.dhosam}` })
  if (f.physicalStatus) chips.push({ key: 'physicalStatus', label: PHYSICAL_STATUS_LABEL[f.physicalStatus] ?? f.physicalStatus })
  if (f.hasPhoto) chips.push({ key: 'hasPhoto', label: 'Has photo' })
  if (f.verifiedOnly) chips.push({ key: 'verifiedOnly', label: 'Verified only' })
  if (f.recentlyJoinedDays)
    chips.push({ key: 'recentlyJoinedDays', label: `Joined in last ${f.recentlyJoinedDays} days` })
  return chips
}

export function removeFilter(f: SearchFilters, key: ChipKey): SearchFilters {
  switch (key) {
    case 'age':
      return { ...f, minAge: undefined, maxAge: undefined }
    case 'income':
      return { ...f, minAnnualIncome: undefined, maxAnnualIncome: undefined }
    case 'height':
      return { ...f, minHeightCm: undefined, maxHeightCm: undefined }
    case 'religion':
      return { ...f, religion: undefined, caste: undefined }
    default:
      return { ...f, [key]: undefined }
  }
}

export function countActiveFilters(f: SearchFilters): number {
  return buildActiveChips(f).length
}

/**
 * Returns an i18n KEY for impossible ranges, else null. The caller resolves
 * the key via t() (this module has no React context).
 */
export function validateFilters(f: SearchFilters): string | null {
  if (f.minAge && f.maxAge && f.minAge > f.maxAge)
    return 'page.search.rangeAgeError'
  if (f.minHeightCm && f.maxHeightCm && f.minHeightCm > f.maxHeightCm)
    return 'page.search.rangeHeightError'
  if (f.minAnnualIncome && f.maxAnnualIncome && f.minAnnualIncome > f.maxAnnualIncome)
    return 'page.search.rangeIncomeError'
  return null
}
