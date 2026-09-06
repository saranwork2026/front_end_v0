import type { SearchFilters } from '@matrimony/shared-core'
import { HIGHEST_EDUCATION_OPTIONS } from '@/src/data/educationOptions'

/** Active-filter chip keys (grouped ranges collapse to one chip). */
export type ChipKey = keyof SearchFilters | 'age' | 'income' | 'height'

export interface ActiveChip {
  key: ChipKey
  label: string
}

const GENDER_LABEL: Record<string, string> = { MALE: 'Male', FEMALE: 'Female' }
const MARITAL_LABEL: Record<string, string> = {
  NEVER_MARRIED: 'Never Married',
  DIVORCED: 'Divorced',
  WIDOWED: 'Widowed',
}
const MANGLIK_LABEL: Record<string, string> = { YES: 'Manglik: Yes', NO: 'Manglik: No', DONT_KNOW: "Manglik: Don't know" }

function educationLabel(code?: string): string {
  if (!code) return ''
  return HIGHEST_EDUCATION_OPTIONS.find((e) => e.value === code)?.label ?? code
}

export function buildActiveChips(f: SearchFilters): ActiveChip[] {
  const chips: ActiveChip[] = []
  if (f.minAge || f.maxAge) chips.push({ key: 'age', label: `Age ${f.minAge ?? 18}–${f.maxAge ?? 60}` })
  if (f.gender) chips.push({ key: 'gender', label: GENDER_LABEL[f.gender] ?? f.gender })
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

/** Returns an error message for impossible ranges, else null. */
export function validateFilters(f: SearchFilters): string | null {
  if (f.minAge && f.maxAge && f.minAge > f.maxAge)
    return 'Minimum age is greater than maximum age. Please adjust the age range.'
  if (f.minHeightCm && f.maxHeightCm && f.minHeightCm > f.maxHeightCm)
    return 'Minimum height is greater than maximum height. Please adjust the height range.'
  if (f.minAnnualIncome && f.maxAnnualIncome && f.minAnnualIncome > f.maxAnnualIncome)
    return 'Minimum income is greater than maximum income. Please adjust the income range.'
  return null
}
