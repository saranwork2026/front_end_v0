import { describe, it, expect } from 'vitest'
import type { SearchFilters } from '@matrimony/shared-core'

import { buildActiveChips, removeFilter, validateFilters } from '@/src/lib/search-filters'

describe('search-filters weight range', () => {
  it('buildActiveChips emits a single weight chip when a bound is set', () => {
    const chips = buildActiveChips({ minWeightKg: 50, maxWeightKg: 80 } as SearchFilters)
    const weight = chips.find((c) => c.key === 'weight')
    expect(weight).toBeDefined()
    expect(weight!.label).toBe('50–80 kg')
  })

  it('buildActiveChips shows "any" for the unset side', () => {
    const chips = buildActiveChips({ minWeightKg: 50 } as SearchFilters)
    expect(chips.find((c) => c.key === 'weight')!.label).toBe('50–any kg')
  })

  it('buildActiveChips emits no weight chip when both bounds are blank', () => {
    const chips = buildActiveChips({} as SearchFilters)
    expect(chips.find((c) => c.key === 'weight')).toBeUndefined()
  })

  it('removeFilter("weight") clears both weight bounds', () => {
    const next = removeFilter({ minWeightKg: 50, maxWeightKg: 80, religion: 'Hindu' } as SearchFilters, 'weight')
    expect(next.minWeightKg).toBeUndefined()
    expect(next.maxWeightKg).toBeUndefined()
    // Leaves unrelated filters intact.
    expect(next.religion).toBe('Hindu')
  })

  it('validateFilters flags minWeightKg > maxWeightKg', () => {
    expect(validateFilters({ minWeightKg: 90, maxWeightKg: 60 } as SearchFilters)).toBe('page.search.rangeWeightError')
  })

  it('validateFilters accepts a valid weight range', () => {
    expect(validateFilters({ minWeightKg: 50, maxWeightKg: 80 } as SearchFilters)).toBeNull()
  })
})
