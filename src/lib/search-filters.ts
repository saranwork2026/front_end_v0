import type { TFunction } from 'i18next'
import type { Gender, SearchFilters } from '@matrimony/shared-core'
import { optionLabel, casteLabelFlat } from '@/src/i18n/optionLabel'
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
export type ChipKey = keyof SearchFilters | 'age' | 'income' | 'height' | 'weight'

export interface ActiveChip {
  key: ChipKey
  label: string
}

/**
 * Build the active-filter chips. `t` is OPTIONAL with an identity fallback so
 * existing one-arg callers (and `countActiveFilters`) keep compiling and still
 * produce today's English labels; the real UI caller (search-view) passes a
 * real `t` so the enum/dropdown chips localize. The module stays React-free
 * (no hook) — consistent with the `validateFilters` "return key, caller
 * resolves" precedent. Only the DISPLAYED label switches; nothing here touches
 * a stored value.
 */
export function buildActiveChips(f: SearchFilters, t?: TFunction): ActiveChip[] {
  const tr: TFunction =
    t ??
    (((k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? k) as unknown as TFunction)
  const chips: ActiveChip[] = []
  if (f.minAge || f.maxAge)
    chips.push({
      key: 'age',
      label: tr('page.search.chipAge', { min: f.minAge ?? 18, max: f.maxAge ?? 60, defaultValue: `Age ${f.minAge ?? 18}–${f.maxAge ?? 60}` }),
    })
  if (f.maritalStatus) chips.push({ key: 'maritalStatus', label: optionLabel(tr, 'marital', f.maritalStatus) })
  if (f.motherTongue) chips.push({ key: 'motherTongue', label: optionLabel(tr, 'motherTongue', f.motherTongue) })
  if (f.religion) chips.push({ key: 'religion', label: optionLabel(tr, 'religion', f.religion) })
  if (f.caste)
    chips.push({
      key: 'caste',
      // Religion-scoped when f.religion is present (matches the filter
      // dropdown); flat first-hit only as a defensive fallback.
      label: f.religion ? optionLabel(tr, 'caste', f.caste, undefined, f.religion) : casteLabelFlat(tr, f.caste),
    })
  if (f.manglik)
    chips.push({ key: 'manglik', label: tr('page.search.chipManglik', { value: optionLabel(tr, 'manglik', f.manglik), defaultValue: `Manglik: ${optionLabel(tr, 'manglik', f.manglik)}` }) })
  if (f.country) chips.push({ key: 'country', label: optionLabel(tr, 'country', f.country) })
  if (f.state) chips.push({ key: 'state', label: optionLabel(tr, 'state', f.state) })
  if (f.city) chips.push({ key: 'city', label: f.city })
  if (f.education) chips.push({ key: 'education', label: optionLabel(tr, 'education', f.education) })
  if (f.profession) chips.push({ key: 'profession', label: optionLabel(tr, 'profession', f.profession) })
  if (f.minAnnualIncome || f.maxAnnualIncome)
    chips.push({ key: 'income', label: tr('page.search.chipIncome', { min: f.minAnnualIncome ?? 0, max: f.maxAnnualIncome ?? '∞', defaultValue: `₹${f.minAnnualIncome ?? 0}–${f.maxAnnualIncome ?? '∞'}` }) })
  if (f.minHeightCm || f.maxHeightCm)
    chips.push({ key: 'height', label: `${f.minHeightCm ?? 'any'}–${f.maxHeightCm ?? 'any'} cm` })
  if (f.minWeightKg || f.maxWeightKg)
    chips.push({ key: 'weight', label: `${f.minWeightKg ?? 'any'}–${f.maxWeightKg ?? 'any'} kg` })
  if (f.nakshatra) chips.push({ key: 'nakshatra', label: optionLabel(tr, 'nakshatra', f.nakshatra) })
  if (f.raasi) chips.push({ key: 'raasi', label: optionLabel(tr, 'raasi', f.raasi) })
  if (f.dhosam)
    chips.push({ key: 'dhosam', label: tr('page.search.chipDhosam', { value: optionLabel(tr, 'dhosam', f.dhosam), defaultValue: `Dhosam: ${optionLabel(tr, 'dhosam', f.dhosam)}` }) })
  if (f.physicalStatus) chips.push({ key: 'physicalStatus', label: optionLabel(tr, 'physicalStatus', f.physicalStatus) })
  if (f.hasPhoto) chips.push({ key: 'hasPhoto', label: tr('page.search.chipHasPhoto', { defaultValue: 'Has photo' }) })
  if (f.verifiedOnly) chips.push({ key: 'verifiedOnly', label: tr('page.search.chipVerifiedOnly', { defaultValue: 'Verified only' }) })
  if (f.recentlyJoinedDays)
    chips.push({ key: 'recentlyJoinedDays', label: tr('page.search.chipRecentlyJoined', { days: f.recentlyJoinedDays, defaultValue: `Joined in last ${f.recentlyJoinedDays} days` }) })
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
    case 'weight':
      return { ...f, minWeightKg: undefined, maxWeightKg: undefined }
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
  if (f.minWeightKg && f.maxWeightKg && f.minWeightKg > f.maxWeightKg)
    return 'page.search.rangeWeightError'
  if (f.minAnnualIncome && f.maxAnnualIncome && f.minAnnualIncome > f.maxAnnualIncome)
    return 'page.search.rangeIncomeError'
  return null
}
