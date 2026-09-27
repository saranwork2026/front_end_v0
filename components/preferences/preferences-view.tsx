'use client'

import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/navigation'

import { landingStore } from '@/src/stores/landing'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Input } from '@/components/ui/input'
import { MultiSelect } from '@/components/ui/multi-select'
import { Select } from '@/components/ui/select'
import { Toaster, type ToastItem } from '@/components/ui/toast'
import { HEIGHT_CM_OPTIONS } from '@/src/data/numericOptions'
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

// Value → label lookups for the Phase 2 multi-selects (options carry a
// display label distinct from the backend value).
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

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="mb-4">
        <h2 className="font-serif text-lg text-foreground">{title}</h2>
        {description && (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </section>
  )
}

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
        if (!cancelled) setForm(p)
      })
      .catch(() => {
        // No saved preference yet — seed the agreed defaults.
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
      pushToast(t('page.preferences.fixFields'), 'error')
      return
    }
    setSaving(true)
    try {
      await savePartnerPreference(form)
      // Reflect that preferences now exist so the landing funnel advances to
      // the plans step instead of bouncing the user back to preferences.
      landingStore.getState().setLandingSignals({ hasPartnerPreferences: true })
      pushToast(t('page.preferences.savedToast'), 'success')
      // Onboarding step after profile submission: surface membership packages
      // next (skippable). The ?onboarding=1 flag tells the plans page to show a
      // "remind me later" path to matches.
      router.push('/plans?onboarding=1')
    } catch {
      pushToast(t('page.preferences.saveError'), 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Section
        title={t('page.preferences.secAgeHeightTitle')}
        description={t('page.preferences.secAgeHeightDesc')}
      >
        <div className="grid gap-4 sm:grid-cols-2">
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
        </div>
      </Section>

      <Section
        title={t('page.preferences.secIncomeHoroTitle')}
        description={t('page.preferences.secIncomeHoroDesc')}
      >
        <div className="grid gap-4 sm:grid-cols-2">
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
          <Select
            label={t('page.preferences.manglik')}
            value={form.manglik ?? ''}
            onChange={(e) => set({ manglik: e.target.value || undefined })}
          >
            {manglikPrefOptions.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </Select>
        </div>
      </Section>

      <Section
        title={t('page.preferences.secCommunityTitle')}
        description={t('page.preferences.secCommunityDesc')}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              {t('page.preferences.religion')}
            </span>
            <OpenToAll
              checked={form.anyReligion}
              onChange={(v) =>
                set({
                  anyReligion: v,
                  ...(v ? { religions: [] } : {}),
                })
              }
            />
          </div>
          <MultiSelect
            options={religions}
            value={form.religions}
            disabled={form.anyReligion}
            emptyHint={t('page.preferences.openAllReligions')}
            searchable
            onChange={(religions) => set({ religions })}
          />

          <div className="flex items-center justify-between pt-1">
            <span className="text-sm font-medium text-foreground">
              {t('page.preferences.caste')}
            </span>
            {/* Caste no-bar is independent of religion no-bar (backend has both). */}
            <OpenToAll
              checked={form.anyCaste}
              onChange={(v) =>
                set({
                  anyCaste: v,
                  ...(v ? { castes: [] } : {}),
                })
              }
            />
          </div>
          <MultiSelect
            options={allCastes}
            value={form.castes}
            disabled={form.anyCaste}
            emptyHint={t('page.preferences.openAllCastes')}
            searchable
            searchPlaceholder={t('page.preferences.searchCaste')}
            onChange={(castes) => set({ castes })}
          />
        </div>
      </Section>

      <Section
        title={t('page.preferences.secMaritalTongueTitle')}
        description={t('page.preferences.secMaritalTongueDesc')}
      >
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                {t('page.preferences.maritalStatus')}
              </span>
              <OpenToAll
                checked={form.anyMaritalStatus}
                onChange={(v) =>
                  set({
                    anyMaritalStatus: v,
                    ...(v ? { maritalStatuses: [] } : {}),
                  })
                }
              />
            </div>
            <MultiSelect
              options={maritalStatusValues}
              optionLabel={maritalStatusLabel}
              value={form.maritalStatuses}
              disabled={form.anyMaritalStatus}
              onChange={(maritalStatuses) => set({ maritalStatuses })}
            />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                {t('page.preferences.motherTongue')}
              </span>
              <OpenToAll
                checked={form.anyMotherTongue}
                onChange={(v) =>
                  set({
                    anyMotherTongue: v,
                    ...(v ? { motherTongues: [] } : {}),
                  })
                }
              />
            </div>
            <MultiSelect
              options={motherTongues}
              value={form.motherTongues}
              disabled={form.anyMotherTongue}
              searchable
              searchPlaceholder={t('page.preferences.searchLanguage')}
              onChange={(motherTongues) => set({ motherTongues })}
            />
          </div>
        </div>
      </Section>

      <Section
        title={t('page.preferences.secEducationTitle')}
        description={t('page.preferences.secEducationDesc')}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              {t('page.preferences.education')}
            </span>
            <OpenToAll
              checked={form.anyEducation}
              onChange={(v) =>
                set({
                  anyEducation: v,
                  ...(v ? { educationCodes: [] } : {}),
                })
              }
            />
          </div>
          <MultiSelect
            options={educationOptions.map((o) => o.code)}
            optionLabel={educationLabel}
            value={form.educationCodes}
            disabled={form.anyEducation}
            onChange={(educationCodes) => set({ educationCodes })}
          />

          <div className="flex items-center justify-between pt-1">
            <span className="text-sm font-medium text-foreground">
              {t('page.preferences.profession')}
            </span>
            <OpenToAll
              checked={form.anyProfession}
              onChange={(v) => set({ anyProfession: v, ...(v ? { professions: [] } : {}) })}
            />
          </div>
          <MultiSelect
            options={professionOptions.map((o) => o.value)}
            optionLabel={professionLabel}
            value={form.professions}
            disabled={form.anyProfession}
            searchable
            onChange={(professions) => set({ professions })}
          />
        </div>
      </Section>

      <Section
        title={t('page.preferences.secLocationTitle')}
        description={t('page.preferences.secLocationDesc')}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              {t('page.preferences.preferredCities')}
            </span>
            <OpenToAll
              checked={form.anyLocation}
              onChange={(v) =>
                set({
                  anyLocation: v,
                  ...(v ? { cities: [] } : {}),
                })
              }
            />
          </div>
          <MultiSelect
            options={cities}
            value={form.cities}
            disabled={form.anyLocation}
            emptyHint={t('page.preferences.openAllLocations')}
            searchable
            searchPlaceholder={t('page.preferences.searchCity')}
            onChange={(cities) => set({ cities })}
          />

          <div className="flex items-center justify-between pt-1">
            <span className="text-sm font-medium text-foreground">
              {t('page.preferences.preferredStates')}
            </span>
            <OpenToAll
              checked={form.anyState}
              onChange={(v) => set({ anyState: v, ...(v ? { states: [] } : {}) })}
            />
          </div>
          <MultiSelect
            options={stateOptions}
            value={form.states}
            disabled={form.anyState}
            searchable
            searchPlaceholder={t('page.preferences.searchState')}
            onChange={(states) => set({ states })}
          />

          <div className="flex items-center justify-between pt-1">
            <span className="text-sm font-medium text-foreground">
              {t('page.preferences.preferredCountries')}
            </span>
            <OpenToAll
              checked={form.anyCountry}
              onChange={(v) => set({ anyCountry: v, ...(v ? { countries: [] } : {}) })}
            />
          </div>
          <MultiSelect
            options={countryOptions}
            value={form.countries}
            disabled={form.anyCountry}
            searchable
            searchPlaceholder={t('page.preferences.searchCountry')}
            onChange={(countries) => set({ countries })}
          />
        </div>
      </Section>

      <Section
        title={t('page.preferences.secPhysicalTitle')}
        description={t('page.preferences.secPhysicalDesc')}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              {t('page.preferences.physicalStatus')}
            </span>
            <OpenToAll
              checked={form.anyPhysicalStatus}
              onChange={(v) => set({ anyPhysicalStatus: v, ...(v ? { physicalStatuses: [] } : {}) })}
            />
          </div>
          <MultiSelect
            options={physicalStatusPrefOptions.map((o) => o.value)}
            optionLabel={physicalStatusLabel}
            value={form.physicalStatuses}
            disabled={form.anyPhysicalStatus}
            onChange={(physicalStatuses) => set({ physicalStatuses })}
          />
        </div>
      </Section>

      <Section
        title={t('page.preferences.secHoroscopeTitle')}
        description={t('page.preferences.secHoroscopeDesc')}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              {t('page.preferences.nakshatra')}
            </span>
            <OpenToAll
              checked={form.anyNakshatra}
              onChange={(v) => set({ anyNakshatra: v, ...(v ? { nakshatras: [] } : {}) })}
            />
          </div>
          <MultiSelect
            options={nakshatraOptions.map((o) => o.value)}
            optionLabel={nakshatraLabel}
            value={form.nakshatras}
            disabled={form.anyNakshatra}
            searchable
            onChange={(nakshatras) => set({ nakshatras })}
          />

          <div className="flex items-center justify-between pt-1">
            <span className="text-sm font-medium text-foreground">
              {t('page.preferences.raasi')}
            </span>
            <OpenToAll
              checked={form.anyRaasi}
              onChange={(v) => set({ anyRaasi: v, ...(v ? { raasis: [] } : {}) })}
            />
          </div>
          <MultiSelect
            options={raasiOptions.map((o) => o.value)}
            optionLabel={raasiLabel}
            value={form.raasis}
            disabled={form.anyRaasi}
            searchable
            onChange={(raasis) => set({ raasis })}
          />

          <div className="flex items-center justify-between pt-1">
            <span className="text-sm font-medium text-foreground">
              {t('page.preferences.dhosam')}
            </span>
            <OpenToAll
              checked={form.anyDhosam}
              onChange={(v) => set({ anyDhosam: v, ...(v ? { dhosams: [] } : {}) })}
            />
          </div>
          <MultiSelect
            options={dhosamPrefOptions.map((o) => o.value)}
            optionLabel={dhosamLabel}
            value={form.dhosams}
            disabled={form.anyDhosam}
            onChange={(dhosams) => set({ dhosams })}
          />
        </div>
      </Section>

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
