import type { TFunction } from 'i18next'

/**
 * Localized label for a dropdown/enum OPTION VALUE. The value is NEVER
 * dot-split (values contain '.', '/', '(' — e.g. the Christian caste
 * 'St. Thomas Evangelical') — we fetch the options sub-object for the
 * namespace once via `returnObjects`, then index it in plain JS.
 *
 * namespace: 'marital' | 'religion' | 'sect' | 'gothram' | 'motherTongue'
 *          | 'country' | 'education' | 'raasi' | 'nakshatra' | 'padham'
 *          | 'manglik' | 'manglikPref' | 'physicalStatus' | 'employedIn'
 *          | 'parentStatus' | 'dhosam' | 'dhosamPref' | 'residency'
 *          | 'bodyType' | 'bloodGroup' | 'complexion' | 'familyType'
 *          | 'familyValues' | 'gender' | 'caste' (two-level, by religion)
 * sub:   optional second level for caste (keyed by religion), e.g. 'Hindu'.
 * fallback: English label if provided, else the value itself.
 *
 * NFR-1/NFR-3: only the DISPLAYED label switches with language; a missing
 * Tamil mapping (or a namespace with no `options.*` sub-object authored, e.g.
 * 'state'/'city'/'profession') falls back to the English label/value — never
 * blank, never a dropped option.
 */
/**
 * Namespaces that are INTENTIONALLY partial — a missing key here is the
 * designed English-fallback path (not a gap), so we don't log it:
 *  - `country` carries Tamil only for the 9 diaspora destinations (design §4);
 *    the other ~120 fall back by design.
 *  - caste religion sub-tables Sikh/Jain/Parsi/Buddhist/etc. are English-only
 *    for now (FR-4); `casteLabelFlat` probes Hindu/Muslim/Christian and a miss
 *    there is expected.
 */
const PARTIAL_NAMESPACES = new Set(['country', 'caste'])

export function optionLabel(
  t: TFunction,
  namespace: string,
  value: string | null | undefined,
  fallback?: string,
  sub?: string,
): string {
  if (!value) return fallback ?? ''
  const key = sub ? `options.${namespace}.${sub}` : `options.${namespace}`
  // The `as unknown` cast is what keeps the `returnObjects` override from
  // leaking a non-string type to callers — every other t(...) call site stays
  // typed `string` (NFR-4, see i18n/config.ts CustomTypeOptions note).
  const table = t(key, { returnObjects: true }) as unknown
  if (table && typeof table === 'object') {
    const hit = (table as Record<string, unknown>)[value]
    if (typeof hit === 'string' && hit.length > 0) return hit
    // The namespace IS authored but this specific key has no Tamil mapping —
    // a genuine gap worth a non-sensitive debug note (namespace + value only,
    // never PII/secrets). Intentionally-partial namespaces (country, caste) and
    // wholly-unauthored ones (state/city/profession) are the DESIGNED fallback
    // path and are NOT logged, to avoid spamming a large dropdown every render.
    if (
      !PARTIAL_NAMESPACES.has(namespace) &&
      typeof console !== 'undefined' &&
      typeof console.debug === 'function'
    ) {
      console.debug('[optionLabel] missing-mapping, fallback-to-English', { namespace, value })
    }
  }
  return fallback ?? value
}

/** Translated religion sub-tables, in resolution order. Keep in sync with FR-4. */
const CASTE_RELIGION_SUBS = ['Hindu', 'Muslim', 'Christian'] as const

/**
 * Localized caste label when the religion is NOT known (partner-preference flat
 * list only — the search chip DOES have f.religion and must NOT use this; see
 * design §6.7). Tries each translated religion sub-table in fixed order; first
 * hit wins, else the English value.
 *
 * SAFETY: `Unspecified`, `Other`, and a handful of community names (e.g.
 * Rajput, Jat, Kshatriya) recur across the Hindu/Muslim/Christian sub-tables
 * and all carry Tamil under FR-4. First-hit is safe because every shared key
 * maps to the SAME Tamil string across religions (`Unspecified` →
 * குறிப்பிடப்படவில்லை, `Other` → மற்றவை), so whichever sub-table wins returns an
 * identical, correct label. Keys unique to one religion resolve there;
 * untranslated castes (Sikh/Jain/…) fall through to English.
 */
export function casteLabelFlat(t: TFunction, value: string | null | undefined): string {
  if (!value) return ''
  for (const sub of CASTE_RELIGION_SUBS) {
    const hit = optionLabel(t, 'caste', value, undefined, sub)
    if (hit !== value) return hit // a sub-table had a Tamil mapping
  }
  return value
}
