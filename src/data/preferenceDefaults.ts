/**
 * Shared defaults + option lists that Search and Partner Preferences both use,
 * so the two pages stay in sync (single source of truth). Values here are the
 * exact backend-valid strings (same lists the wizard/edit pages use).
 *
 * Agreed defaults (applied on first load when nothing is saved yet):
 *   - Min age: 18 if the member is MALE, 21 if FEMALE. Max age: empty.
 *   - Height min: 147 cm (~4'10", a sensible Indian floor). Max: empty.
 *   - Marital status: Never Married
 *   - Mother tongue: Tamil
 *   - Religion: Hindu
 *   - Caste: none selected, no-bar OFF
 *   - Manglik: No / Dhosam: None
 *   - Country: India, State: Tamil Nadu
 *   - Physical status: Normal
 *   - Quick filters (Search only): off
 */

import type { Gender, PhysicalStatus } from '@matrimony/shared-core'

/** Default height floor in cm (~4'10"). */
export const DEFAULT_MIN_HEIGHT_CM = 147

/** Gender-based minimum-age default (legal marriage age in India). */
export function defaultMinAge(gender?: Gender | null): number {
  return gender === 'FEMALE' ? 21 : 18
}

// Backend-valid default values (kept as constants so both pages agree).
export const DEFAULT_MARITAL_STATUS = 'NEVER_MARRIED'
export const DEFAULT_MOTHER_TONGUE = 'Tamil'
export const DEFAULT_RELIGION = 'Hindu'
export const DEFAULT_MANGLIK = 'NO'
export const DEFAULT_DHOSAM = 'NONE'
export const DEFAULT_COUNTRY = 'India'
export const DEFAULT_STATE = 'Tamil Nadu'
export const DEFAULT_PHYSICAL_STATUS: PhysicalStatus = 'NORMAL'

/** Physical-status options (matches backend enum PhysicalStatus). */
export const PHYSICAL_STATUS_OPTIONS: { value: PhysicalStatus; label: string }[] = [
  { value: 'NORMAL', label: 'Normal' },
  { value: 'PHYSICALLY_CHALLENGED', label: 'Physically Challenged' },
]

/** "Recently joined" window options for the Search quick filter. */
export const RECENTLY_JOINED_OPTIONS: { value: number; label: string }[] = [
  { value: 7, label: 'Last 7 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days' },
]
