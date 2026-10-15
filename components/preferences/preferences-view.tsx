'use client'

import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/navigation'

import { landingStore } from '@/src/stores/landing'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Input } from '@/components/ui/input'
import { SearchableMultiSelect } from '@/components/ui/searchable-multi-select'
import { Select } from '@/components/ui/select'
import { Toaster, type ToastItem } from '@/components/ui/toast'
import { HEIGHT_CM_OPTIONS, WEIGHT_KG_OPTIONS } from '@/src/data/numericOptions'
import {
  allCastes,
  cities,
  countryOptions,
  defaultPreference,
  dhosamPrefOptions,
  educationLabel,
  educationOptions,
  emptyPreference,
  getPartnerPreference,
  manglikPrefOptions,
  maritalStatusLabel,
  maritalStatusValues,
  motherTongues,
  nakshatraOptions,
  physicalStatusPrefOptions,
  professionOptions,
  raasiOptions,
  religions,
  savePartnerPreference,
  stateOptions,
  validatePreference,
  type PartnerPreference,
} from '@/lib/preferences-data'
import type { Gender } from '@matrimony/shared-core'
import { profileApi } from '@/src/lib/api'
import { flattenProfileResponse } from '@/src/lib/adapters'

// value = actual rupees (what the backend stores), label = LPA display.
const incomeOptions = [
  { value: 300000, label: '₹3 LPA' },
  { value: 500000, label: '₹5 LPA' },
  { value: 700000, label: '₹7 LPA' },
  { value: 1000000, label: '₹10 LPA' },
  { value: 1500000, label: '₹15 LPA' },
  { value: 2000000, label: '₹20 LPA' },
  { value: 3000000, label: '₹30 LPA' },
  { value: 5000000, label: '₹50 LPA' },
]
const heightOptions = HEIGHT_CM_OPTIONS.map((h) => ({ cm: h.value, label: h.label }))
const weightOptions = WEIGHT_KG_OPTIONS.map((w) => ({ kg: w.value, label: w.label }))

// Value → label lookups for the multi-selects (options carry a display label
// distinct from the backend value).
const nakshatraLabelMap = new Map(nakshatraOptions.map((o) => [o.value, o.label]))
const raasiLabelMap = new Map(raasiOptions.map((o) => [o.value, o.label]))
const dhosamLabelMap = new Map(dhosamPrefOptions.map((o) => [o.value, o.label]))
const physicalStatusLabelMap = new Map<string, string>(
  physicalStatusPrefOptions.map((o) => [o.value, o.label]),
)
const professionLabelMap = new Map(professionOptions.map((o) => [o.value, o.label]))
const nakshatraLabel = (v: string) => nakshatraLabelMap.get(v) ?? v
const raasiLabel = (v: string) => raasiLabelMap.get(v) ?? v
const dhosamLabel = (v: string) => dhosamLabelMap.get(v) ?? v
const physicalStatusLabel = (v: string) => physicalStatusLabelMap.get(v) ?? v
const professionLabel = (v: string) => professionLabelMap.get(v) ?? v

/** A labelled "Open to all" switch used by the no-bar toggles. */
function OpenToAll({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (v: boolean) => void
}) {
  const { t } = useTranslation()
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 rounded border-input text-primary focus-visible:ring-2 focus-visible:ring-ring/40"
      />
      {t('page.preferences.openToAll')}
    </label>
  )
}

/**
 * A single field block inside the one card: an individual field label, an
 * optional per-field "Open to all" toggle, and the field control(s). Every
 * field renders its own label (no "&"-joined section titles).
 */
function Field({
  label,
  toggle,
  children,
}: {
  label: string
  toggle?: React.ReactNode
  /**
   * Either plain field control(s), or a render function receiving the id of
   * this field's visible label span so a custom control (e.g. the dropdown
   * trigger) can associate itself via aria-labelledby without duplicating the
   * visible label text.
   */
  children: React.ReactNode | ((labelId: string) => React.ReactNode)
}) {
  const labelId = React.useId()
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span id={labelId} className="text-sm font-medium text-foreground">
          {label}
        </span>
        {toggle}
      </div>
      {typeof children === 'function' ? children(labelId) : children}
    </div>
  )
}

const toNum = (v: string) => (v === '' ? undefined : Number(v))

export function PreferencesView({
  initial = 'saved',
}: {
  initial?: 'saved' | 'empty'
}) {
  const router = useRouter()
  const { t } = useTranslation()
  const [form, setForm] = React.useState<PartnerPreference>(emptyPreference)
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [saving, setSaving] = React.useState(false)
  const [toasts, setToasts] = React.useState<ToastItem[]>([])

  // Seed from the saved partner preference when one exists. When there is none
  // yet (new member, or PREFERENCE_NOT_FOUND), seed the agreed first-load
  // defaults (age floor 18 male / 21 female, height 147 cm, Never Married,
  // Tamil, Hindu, Manglik No — see lib/preferences-data.defaultPreference and
  // src/data/preferenceDefaults.ts), using the member's own gender for the
  // min-age floor. Everything stays editable.
  React.useEffect(() => {
    let cancelled = false

    // Resolve the member's own gender first (drives the min-age default), then
    // apply saved prefs on top if any exist.
    const seedDefaults = () =>
      profileApi
        .getProfile()
        .then((res) => {
          if (cancelled) return
          const { gender } = flattenProfileResponse(res.data as unknown as Record<string, unknown>)
          setForm(defaultPreference(gender as Gender | undefined))
        })
        .catch(() => {
          if (!cancelled) setForm(defaultPreference())
        })

    if (initial === 'empty') {
      void seedDefaults()
      return () => {
        cancelled = true
      }
    }

    getPartnerPreference()
      .then((p) => {
        if (!cancelled) {
          setForm(p)
          // Event-only diagnostic — no preference values are logged.
          console.info('[preferences] loaded saved partner preferences')
        }
      })
      .catch(() => {
        // No saved preference yet — seed the agreed defaults.
        console.info('[preferences] no saved partner preferences; seeding defaults')
        void seedDefaults()
      })
    return () => {
      cancelled = true
    }
  }, [initial])

  const pushToast = (message: string, variant: ToastItem['variant']) =>
    setToasts((t) => [...t, { id: Date.now() + Math.random(), message, variant }])
  const dismissToast = (id: number) =>
    setToasts((t) => t.filter((x) => x.id !== id))

  const set = (patch: Partial<PartnerPreference>) =>
    setForm((f) => ({ ...f, ...patch }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const nextErrors = validatePreference(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      // Event-only: log that validation blocked the save and which field keys
      // failed — never the field values.
      console.warn('[preferences] save blocked by validation', Object.keys(nextErrors))
      pushToast(t('page.preferences.fixFields'), 'error')
      return
    }
    setSaving(true)
    console.info('[preferences] saving partner preferences')
    try {
      await savePartnerPreference(form)
      // Reflect that preferences now exist so the landing funnel advances to
      // the plans step instead of bouncing the user back to preferences.
      landingStore.getState().setLandingSignals({ hasPartnerPreferences: true })
      console.info('[preferences] partner preferences saved')
      pushToast(t('page.preferences.savedToast'), 'success')
      // Onboarding step after profile submission: surface membership packages
      // next (skippable). The ?onboarding=1 flag tells the plans page to show a
      // "remind me later" path to matches.
      router.push('/plans?onboarding=1')
    } catch {
      console.error('[preferences] failed to save partner preferences')
      pushToast(t('page.preferences.saveError'), 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* ONE single card — every criterion is an individual field in a fixed
          order (marital status, mother tongue, age, height, weight, physical
          status, education, profession, income, country, state, city,
          religion, caste, nakshatra, raasi, manglik, dhosam). No section
          cards, no section descriptions, no "&"-joined titles. */}
      <div className="space-y-5 rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
        {/* 1. Marital status */}
        <Field
          label={t('page.preferences.maritalStatus')}
          toggle={
            <OpenToAll
              checked={form.anyMaritalStatus}
              onChange={(v) =>
                set({ anyMaritalStatus: v, ...(v ? { maritalStatuses: [] } : {}) })
              }
            />
          }
        >
          {(labelId) => (
            <SearchableMultiSelect
              labelledBy={labelId}
              options={maritalStatusValues}
              optionLabel={maritalStatusLabel}
              value={form.maritalStatuses}
              disabled={form.anyMaritalStatus}
              onChange={(maritalStatuses) => set({ maritalStatuses })}
            />
          )}
        </Field>

        {/* 2. Mother tongue */}
        <Field
          label={t('page.preferences.motherTongue')}
          toggle={
            <OpenToAll
              checked={form.anyMotherTongue}
              onChange={(v) =>
                set({ anyMotherTongue: v, ...(v ? { motherTongues: [] } : {}) })
              }
            />
          }
        >
          {(labelId) => (
            <SearchableMultiSelect
              labelledBy={labelId}
              options={motherTongues}
              value={form.motherTongues}
              disabled={form.anyMotherTongue}
              searchPlaceholder={t('page.preferences.searchLanguage')}
              onChange={(motherTongues) => set({ motherTongues })}
            />
          )}
        </Field>

        {/* 3. Age */}
        <Field label={t('page.preferences.age')}>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t('page.preferences.minAge')}
              type="number"
              inputMode="numeric"
              min={18}
              placeholder={t('page.preferences.any')}
              value={form.minAge ?? ''}
              onChange={(e) => set({ minAge: toNum(e.target.value) })}
            />
            <Input
              label={t('page.preferences.maxAge')}
              type="number"
              inputMode="numeric"
              min={18}
              placeholder={t('page.preferences.any')}
              value={form.maxAge ?? ''}
              error={errors.maxAge}
              onChange={(e) => set({ maxAge: toNum(e.target.value) })}
            />
          </div>
        </Field>

        {/* 4. Height */}
        <Field label={t('page.preferences.height')}>
          <div className="grid grid-cols-2 gap-3">
            <Select
              label={t('page.preferences.minHeight')}
              value={form.minHeightCm ?? ''}
              onChange={(e) => set({ minHeightCm: toNum(e.target.value) })}
            >
              <option value="">{t('page.preferences.any')}</option>
              {heightOptions.map((h) => (
                <option key={h.cm} value={h.cm}>
                  {h.label}
                </option>
              ))}
            </Select>
            <Select
              label={t('page.preferences.maxHeight')}
              value={form.maxHeightCm ?? ''}
              error={errors.maxHeightCm}
              onChange={(e) => set({ maxHeightCm: toNum(e.target.value) })}
            >
              <option value="">{t('page.preferences.any')}</option>
              {heightOptions.map((h) => (
                <option key={h.cm} value={h.cm}>
                  {h.label}
                </option>
              ))}
            </Select>
          </div>
        </Field>

        {/* 5. Weight (NEW) */}
        <Field label={t('page.preferences.weight')}>
          <div className="grid grid-cols-2 gap-3">
            <Select
              label={t('page.preferences.minWeight')}
              value={form.minWeightKg ?? ''}
              onChange={(e) => set({ minWeightKg: toNum(e.target.value) })}
            >
              <option value="">{t('page.preferences.any')}</option>
              {weightOptions.map((w) => (
                <option key={w.kg} value={w.kg}>
                  {w.label}
                </option>
              ))}
            </Select>
            <Select
              label={t('page.preferences.maxWeight')}
              value={form.maxWeightKg ?? ''}
              error={errors.maxWeightKg}
              onChange={(e) => set({ maxWeightKg: toNum(e.target.value) })}
            >
              <option value="">{t('page.preferences.any')}</option>
              {weightOptions.map((w) => (
                <option key={w.kg} value={w.kg}>
                  {w.label}
                </option>
              ))}
            </Select>
          </div>
        </Field>

        {/* 6. Physical status */}
        <Field
          label={t('page.preferences.physicalStatus')}
          toggle={
            <OpenToAll
              checked={form.anyPhysicalStatus}
              onChange={(v) =>
                set({ anyPhysicalStatus: v, ...(v ? { physicalStatuses: [] } : {}) })
              }
            />
          }
        >
          {(labelId) => (
            <SearchableMultiSelect
              labelledBy={labelId}
              options={physicalStatusPrefOptions.map((o) => o.value)}
              optionLabel={physicalStatusLabel}
              value={form.physicalStatuses}
              disabled={form.anyPhysicalStatus}
              onChange={(physicalStatuses) => set({ physicalStatuses })}
            />
          )}
        </Field>

        {/* 7. Education */}
        <Field
          label={t('page.preferences.education')}
          toggle={
            <OpenToAll
              checked={form.anyEducation}
              onChange={(v) =>
                set({ anyEducation: v, ...(v ? { educationCodes: [] } : {}) })
              }
            />
          }
        >
          {(labelId) => (
            <SearchableMultiSelect
              labelledBy={labelId}
              options={educationOptions.map((o) => o.code)}
              optionLabel={educationLabel}
              value={form.educationCodes}
              disabled={form.anyEducation}
              onChange={(educationCodes) => set({ educationCodes })}
            />
          )}
        </Field>

        {/* 8. Profession */}
        <Field
          label={t('page.preferences.profession')}
          toggle={
            <OpenToAll
              checked={form.anyProfession}
              onChange={(v) => set({ anyProfession: v, ...(v ? { professions: [] } : {}) })}
            />
          }
        >
          {(labelId) => (
            <SearchableMultiSelect
              labelledBy={labelId}
              options={professionOptions.map((o) => o.value)}
              optionLabel={professionLabel}
              value={form.professions}
              disabled={form.anyProfession}
              onChange={(professions) => set({ professions })}
            />
          )}
        </Field>

        {/* 9. Income */}
        <Field label={t('page.preferences.income')}>
          <div className="grid grid-cols-2 gap-3">
            <Select
              label={t('page.preferences.minIncome')}
              value={form.minAnnualIncome ?? ''}
              onChange={(e) => set({ minAnnualIncome: toNum(e.target.value) })}
            >
              <option value="">{t('page.preferences.any')}</option>
              {incomeOptions.map((i) => (
                <option key={i.value} value={i.value}>
                  {i.label}
                </option>
              ))}
            </Select>
            <Select
              label={t('page.preferences.maxIncome')}
              value={form.maxAnnualIncome ?? ''}
              error={errors.maxAnnualIncome}
              onChange={(e) => set({ maxAnnualIncome: toNum(e.target.value) })}
            >
              <option value="">{t('page.preferences.any')}</option>
              {incomeOptions.map((i) => (
                <option key={i.value} value={i.value}>
                  {i.label}
                </option>
              ))}
            </Select>
          </div>
        </Field>

        {/* 10. Country */}
        <Field
          label={t('page.preferences.preferredCountries')}
          toggle={
            <OpenToAll
              checked={form.anyCountry}
              onChange={(v) => set({ anyCountry: v, ...(v ? { countries: [] } : {}) })}
            />
          }
        >
          {(labelId) => (
            <SearchableMultiSelect
              labelledBy={labelId}
              options={countryOptions}
              value={form.countries}
              disabled={form.anyCountry}
              searchPlaceholder={t('page.preferences.searchCountry')}
              onChange={(countries) => set({ countries })}
            />
          )}
        </Field>

        {/* 11. State */}
        <Field
          label={t('page.preferences.preferredStates')}
          toggle={
            <OpenToAll
              checked={form.anyState}
              onChange={(v) => set({ anyState: v, ...(v ? { states: [] } : {}) })}
            />
          }
        >
          {(labelId) => (
            <SearchableMultiSelect
              labelledBy={labelId}
              options={stateOptions}
              value={form.states}
              disabled={form.anyState}
              searchPlaceholder={t('page.preferences.searchState')}
              onChange={(states) => set({ states })}
            />
          )}
        </Field>

        {/* 12. City */}
        <Field
          label={t('page.preferences.preferredCities')}
          toggle={
            <OpenToAll
              checked={form.anyLocation}
              onChange={(v) => set({ anyLocation: v, ...(v ? { cities: [] } : {}) })}
            />
          }
        >
          {(labelId) => (
            <SearchableMultiSelect
              labelledBy={labelId}
              options={cities}
              value={form.cities}
              disabled={form.anyLocation}
              emptyHint={t('page.preferences.openAllLocations')}
              searchPlaceholder={t('page.preferences.searchCity')}
              onChange={(cities) => set({ cities })}
            />
          )}
        </Field>

        {/* 13. Religion */}
        <Field
          label={t('page.preferences.religion')}
          toggle={
            <OpenToAll
              checked={form.anyReligion}
              onChange={(v) => set({ anyReligion: v, ...(v ? { religions: [] } : {}) })}
            />
          }
        >
          {(labelId) => (
            <SearchableMultiSelect
              labelledBy={labelId}
              options={religions}
              value={form.religions}
              disabled={form.anyReligion}
              emptyHint={t('page.preferences.openAllReligions')}
              onChange={(religions) => set({ religions })}
            />
          )}
        </Field>

        {/* 14. Caste */}
        <Field
          label={t('page.preferences.caste')}
          toggle={
            <OpenToAll
              checked={form.anyCaste}
              onChange={(v) => set({ anyCaste: v, ...(v ? { castes: [] } : {}) })}
            />
          }
        >
          {(labelId) => (
            <SearchableMultiSelect
              labelledBy={labelId}
              options={allCastes}
              value={form.castes}
              disabled={form.anyCaste}
              emptyHint={t('page.preferences.openAllCastes')}
              searchPlaceholder={t('page.preferences.searchCaste')}
              onChange={(castes) => set({ castes })}
            />
          )}
        </Field>

        {/* 15. Nakshatra */}
        <Field
          label={t('page.preferences.nakshatra')}
          toggle={
            <OpenToAll
              checked={form.anyNakshatra}
              onChange={(v) => set({ anyNakshatra: v, ...(v ? { nakshatras: [] } : {}) })}
            />
          }
        >
          {(labelId) => (
            <SearchableMultiSelect
              labelledBy={labelId}
              options={nakshatraOptions.map((o) => o.value)}
              optionLabel={nakshatraLabel}
              value={form.nakshatras}
              disabled={form.anyNakshatra}
              onChange={(nakshatras) => set({ nakshatras })}
            />
          )}
        </Field>

        {/* 16. Raasi */}
        <Field
          label={t('page.preferences.raasi')}
          toggle={
            <OpenToAll
              checked={form.anyRaasi}
              onChange={(v) => set({ anyRaasi: v, ...(v ? { raasis: [] } : {}) })}
            />
          }
        >
          {(labelId) => (
            <SearchableMultiSelect
              labelledBy={labelId}
              options={raasiOptions.map((o) => o.value)}
              optionLabel={raasiLabel}
              value={form.raasis}
              disabled={form.anyRaasi}
              onChange={(raasis) => set({ raasis })}
            />
          )}
        </Field>

        {/* 17. Manglik */}
        <Field label={t('page.preferences.manglik')}>
          {(labelId) => (
            <Select
              aria-labelledby={labelId}
              value={form.manglik ?? ''}
              onChange={(e) => set({ manglik: e.target.value || undefined })}
            >
              {manglikPrefOptions.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </Select>
          )}
        </Field>

        {/* 18. Dhosam */}
        <Field
          label={t('page.preferences.dhosam')}
          toggle={
            <OpenToAll
              checked={form.anyDhosam}
              onChange={(v) => set({ anyDhosam: v, ...(v ? { dhosams: [] } : {}) })}
            />
          }
        >
          {(labelId) => (
            <SearchableMultiSelect
              labelledBy={labelId}
              options={dhosamPrefOptions.map((o) => o.value)}
              optionLabel={dhosamLabel}
              value={form.dhosams}
              disabled={form.anyDhosam}
              onChange={(dhosams) => set({ dhosams })}
            />
          )}
        </Field>
      </div>

      {/* Sticky submit — full-width on mobile */}
      <div className="sticky bottom-0 -mx-4 border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:pt-1">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <p className="hidden text-sm text-muted-foreground sm:mr-auto sm:block">
            {t('page.preferences.changeAnyTime')}
          </p>
          <Button
            type="submit"
            size="lg"
            loading={saving}
            className="w-full sm:w-auto"
          >
            {!saving && <Icon name="check" size={18} />}
            {t('page.preferences.save')}
          </Button>
        </div>
      </div>

      <Toaster toasts={toasts} onDismiss={dismissToast} />
    </form>
  )
}
