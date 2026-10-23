import { describe, it, expect } from 'vitest'
import type { TFunction } from 'i18next'
import type { SearchFilters } from '@matrimony/shared-core'

import i18n from '@/src/i18n/config'
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

describe('buildActiveChips localization (optional t)', () => {
  it('enum chips localize under ta while numeric chips stay numeric', async () => {
    await i18n.changeLanguage('ta')
    const t = i18n.t.bind(i18n) as unknown as TFunction
    const chips = buildActiveChips(
      { maritalStatus: 'NEVER_MARRIED', religion: 'Hindu', minWeightKg: 50, maxWeightKg: 80 } as SearchFilters,
      t,
    )
    expect(chips.find((c) => c.key === 'maritalStatus')!.label).toBe('திருமணமாகாதவர்')
    expect(chips.find((c) => c.key === 'religion')!.label).toBe('இந்து')
    // Numeric chips are language-neutral.
    expect(chips.find((c) => c.key === 'weight')!.label).toBe('50–80 kg')
    await i18n.changeLanguage('en')
  })

  it('search caste chip is religion-scoped when f.religion is present', async () => {
    await i18n.changeLanguage('ta')
    const t = i18n.t.bind(i18n) as unknown as TFunction
    const chips = buildActiveChips({ religion: 'Hindu', caste: 'Brahmin - Iyer' } as SearchFilters, t)
    expect(chips.find((c) => c.key === 'caste')!.label).toBe('பிராமணர் - ஐயர்')
    await i18n.changeLanguage('en')
  })

  it('one-arg call (no t) still produces English labels (identity fallback)', () => {
    const chips = buildActiveChips({ maritalStatus: 'NEVER_MARRIED' } as SearchFilters)
    // Identity fallback returns the value (no locale lookup without a real t).
    expect(chips.find((c) => c.key === 'maritalStatus')!.label).toBe('NEVER_MARRIED')
  })
})
