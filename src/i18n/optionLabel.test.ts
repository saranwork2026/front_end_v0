import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import type { TFunction } from 'i18next'

import i18n from '@/src/i18n/config'
import { optionLabel, casteLabelFlat } from '@/src/i18n/optionLabel'

/**
 * These run against the real i18n instance so they lock the actual i18next
 * key-resolution semantics (the `returnObjects` + JS-index path, never
 * dot-splitting) that the whole feature depends on.
 */
const t = i18n.t.bind(i18n) as unknown as TFunction

async function withLang<T>(lang: 'en' | 'ta', fn: () => T): Promise<T> {
  await i18n.changeLanguage(lang)
  return fn()
}

beforeAll(async () => {
  await i18n.changeLanguage('en')
})
afterAll(async () => {
  await i18n.changeLanguage('en')
})

describe('optionLabel — dotted/paren/slash/hyphen values resolve by JS index', () => {
  it('hyphen value (Brahmin - Iyer) resolves in ta and en', async () => {
    expect(await withLang('en', () => optionLabel(t, 'caste', 'Brahmin - Iyer', undefined, 'Hindu'))).toBe(
      'Brahmin - Iyer',
    )
    expect(await withLang('ta', () => optionLabel(t, 'caste', 'Brahmin - Iyer', undefined, 'Hindu'))).toBe(
      'பிராமணர் - ஐயர்',
    )
  })

  it('paren value (Assembly of God (AG)) resolves', async () => {
    expect(await withLang('ta', () => optionLabel(t, 'caste', 'Assembly of God (AG)', undefined, 'Christian'))).toBe(
      'அசெம்பிளி ஆஃப் காட் (AG)',
    )
  })

  it('slash value (Muthuraja / Muthuracha) resolves', async () => {
    expect(await withLang('ta', () => optionLabel(t, 'caste', 'Muthuraja / Muthuracha', undefined, 'Hindu'))).toBe(
      'முத்துராஜா / முத்துராச்சா',
    )
  })

  it('DOTTED value (St. Thomas Evangelical) resolves (not dot-split)', async () => {
    // The critical case: a '.' in the value must NOT cause i18next to split.
    expect(await withLang('en', () => optionLabel(t, 'caste', 'St. Thomas Evangelical', undefined, 'Christian'))).toBe(
      'St. Thomas Evangelical',
    )
    expect(await withLang('ta', () => optionLabel(t, 'caste', 'St. Thomas Evangelical', undefined, 'Christian'))).toBe(
      'புனித தோமா எவாஞ்சலிக்கல்',
    )
  })
})

describe('optionLabel — fallback & empty handling', () => {
  it('missing key returns the provided fallback', () => {
    expect(optionLabel(t, 'religion', 'NOT_A_RELIGION', 'My Fallback')).toBe('My Fallback')
  })

  it('missing key with no fallback returns the value itself', () => {
    expect(optionLabel(t, 'religion', 'NOT_A_RELIGION')).toBe('NOT_A_RELIGION')
  })

  it('null/empty value returns the fallback (or empty string)', () => {
    expect(optionLabel(t, 'religion', null)).toBe('')
    expect(optionLabel(t, 'religion', undefined, 'fb')).toBe('fb')
  })

  it('missing-namespace (state/profession) falls back to the English value', () => {
    // No options.state / options.profession sub-object is authored, so the
    // helper returns the value via the typeof-object guard.
    expect(optionLabel(t, 'state', 'Tamil Nadu')).toBe('Tamil Nadu')
    expect(optionLabel(t, 'profession', 'Engineer')).toBe('Engineer')
  })
})

describe('optionLabel — language flip changes label, never the value', () => {
  it('religion Hindu: ta Tamil, en English', async () => {
    expect(await withLang('en', () => optionLabel(t, 'religion', 'Hindu'))).toBe('Hindu')
    expect(await withLang('ta', () => optionLabel(t, 'religion', 'Hindu'))).toBe('இந்து')
  })

  it('marital NEVER_MARRIED localizes per mode (value key unchanged)', async () => {
    expect(await withLang('en', () => optionLabel(t, 'marital', 'NEVER_MARRIED'))).toBe('Never Married')
    expect(await withLang('ta', () => optionLabel(t, 'marital', 'NEVER_MARRIED'))).toBe('திருமணமாகாதவர்')
  })

  it('education Doctorate (Ph.D label) resolves by value key, not by its dotted label', async () => {
    expect(await withLang('en', () => optionLabel(t, 'education', 'Doctorate'))).toBe('Doctorate (Ph.D)')
    expect(await withLang('ta', () => optionLabel(t, 'education', 'Doctorate'))).toBe('முனைவர் பட்டம் (Ph.D)')
  })
})

describe('optionLabel — horoscope labels are language-PURE', () => {
  it('raasi Mesham: ta is pure Tamil, en is pure English (no parenthetical mix)', async () => {
    const ta = await withLang('ta', () => optionLabel(t, 'raasi', 'Mesham'))
    const en = await withLang('en', () => optionLabel(t, 'raasi', 'Mesham'))
    expect(ta).toBe('மேஷம்')
    expect(ta).not.toContain('Mesham')
    expect(ta).not.toContain('Aries')
    expect(en).toBe('Mesham')
    expect(en).not.toMatch(/[\u0B80-\u0BFF]/) // no Tamil glyphs
    expect(en).not.toContain('Aries')
  })

  it('nakshatra Ashwini language-pure', async () => {
    expect(await withLang('ta', () => optionLabel(t, 'nakshatra', 'Ashwini'))).toBe('அஸ்வினி')
    expect(await withLang('en', () => optionLabel(t, 'nakshatra', 'Ashwini'))).toBe('Ashwini')
  })
})

describe('casteLabelFlat — religion-less first-hit resolution', () => {
  it('shared keys (Unspecified/Other) map to the SAME Tamil across religions', async () => {
    expect(await withLang('ta', () => casteLabelFlat(t, 'Unspecified'))).toBe('குறிப்பிடப்படவில்லை')
    expect(await withLang('ta', () => casteLabelFlat(t, 'Other'))).toBe('மற்றவை')
  })

  it('a Hindu-only caste resolves to its Hindu Tamil', async () => {
    expect(await withLang('ta', () => casteLabelFlat(t, 'Brahmin - Iyer'))).toBe('பிராமணர் - ஐயர்')
  })

  it('a Sikh/Jain caste (untranslated) falls back to English', async () => {
    // "KVO" (Jain) and "Ahluwalia" (Sikh) have no Tamil mapping authored.
    expect(await withLang('ta', () => casteLabelFlat(t, 'KVO'))).toBe('KVO')
    expect(await withLang('ta', () => casteLabelFlat(t, 'Ahluwalia'))).toBe('Ahluwalia')
  })

  it('null returns empty string', () => {
    expect(casteLabelFlat(t, null)).toBe('')
  })
})

describe('casteLabelFlat — shared-key Tamil parity across Hindu/Muslim/Christian', () => {
  it('every key present in more than one sub-table maps to an identical Tamil string', async () => {
    await i18n.changeLanguage('ta')
    const subs = ['Hindu', 'Muslim', 'Christian'] as const
    const tables = subs.map(
      (s) => t(`options.caste.${s}`, { returnObjects: true }) as unknown as Record<string, string>,
    )
    // Collect the intersection of keys across any two tables.
    const counts = new Map<string, number>()
    for (const tbl of tables) {
      for (const k of Object.keys(tbl)) counts.set(k, (counts.get(k) ?? 0) + 1)
    }
    const shared = [...counts.entries()].filter(([, n]) => n > 1).map(([k]) => k)
    expect(shared.length).toBeGreaterThan(0) // sanity: Unspecified/Other at least
    for (const key of shared) {
      const values = tables.filter((tbl) => key in tbl).map((tbl) => tbl[key])
      const unique = new Set(values)
      expect(unique.size, `caste key "${key}" diverges across religions: ${JSON.stringify(values)}`).toBe(1)
    }
    await i18n.changeLanguage('en')
  })
})
