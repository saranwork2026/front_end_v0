'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'

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
  educationLabel,
  educationOptions,
  emptyPreference,
  getPartnerPreference,
  manglikPrefOptions,
  maritalStatusLabel,
  maritalStatusValues,
  motherTongues,
  religions,
  savePartnerPreference,
  validatePreference,
  type PartnerPreference,
} from '@/lib/preferences-data'

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
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 rounded border-input text-primary focus-visible:ring-2 focus-visible:ring-ring/40"
      />
      Open to all
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
  const [form, setForm] = React.useState<PartnerPreference>(emptyPreference)
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [saving, setSaving] = React.useState(false)
  const [toasts, setToasts] = React.useState<ToastItem[]>([])

  // Seed from the saved partner preference. SUBSCRIPTION/PREFERENCE_NOT_FOUND
  // (no prefs yet) falls back to the "open to all" empty defaults.
  React.useEffect(() => {
    if (initial === 'empty') return
    let cancelled = false
    getPartnerPreference()
      .then((p) => {
        if (!cancelled) setForm(p)
      })
      .catch(() => {
        /* No saved preference yet — keep empty defaults. */
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
      pushToast('Please fix the highlighted fields.', 'error')
      return
    }
    setSaving(true)
    try {
      await savePartnerPreference(form)
      pushToast(
        'Preferences saved. We will use these to refine your matches.',
        'success',
      )
      // Onboarding step after profile submission: surface membership packages
      // next (skippable). The ?onboarding=1 flag tells the plans page to show a
      // "skip / continue" path back to the profile status screen.
      router.push('/plans?onboarding=1')
    } catch {
      pushToast(
        'Could not save preferences. Please try again in a moment.',
        'error',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Section
        title="Age & height"
        description="Set the range you're open to. Leave blank for no limit."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Min age"
              type="number"
              inputMode="numeric"
              min={18}
              placeholder="Any"
              value={form.minAge ?? ''}
              onChange={(e) => set({ minAge: toNum(e.target.value) })}
            />
            <Input
              label="Max age"
              type="number"
              inputMode="numeric"
              min={18}
              placeholder="Any"
              value={form.maxAge ?? ''}
              error={errors.maxAge}
              onChange={(e) => set({ maxAge: toNum(e.target.value) })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Min height"
              value={form.minHeightCm ?? ''}
              onChange={(e) => set({ minHeightCm: toNum(e.target.value) })}
            >
              <option value="">Any</option>
              {heightOptions.map((h) => (
                <option key={h.cm} value={h.cm}>
                  {h.label}
                </option>
              ))}
            </Select>
            <Select
              label="Max height"
              value={form.maxHeightCm ?? ''}
              error={errors.maxHeightCm}
              onChange={(e) => set({ maxHeightCm: toNum(e.target.value) })}
            >
              <option value="">Any</option>
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
        title="Income & horoscope"
        description="Financial expectations and Manglik / Dhosam preference."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Min income"
              value={form.minAnnualIncome ?? ''}
              onChange={(e) => set({ minAnnualIncome: toNum(e.target.value) })}
            >
              <option value="">Any</option>
              {incomeOptions.map((i) => (
                <option key={i.value} value={i.value}>
                  {i.label}
                </option>
              ))}
            </Select>
            <Select
              label="Max income"
              value={form.maxAnnualIncome ?? ''}
              error={errors.maxAnnualIncome}
              onChange={(e) => set({ maxAnnualIncome: toNum(e.target.value) })}
            >
              <option value="">Any</option>
              {incomeOptions.map((i) => (
                <option key={i.value} value={i.value}>
                  {i.label}
                </option>
              ))}
            </Select>
          </div>
          <Select
            label="Manglik / Dhosam"
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
        title="Community"
        description="Religion and caste. Turn on “Open to all” for each to match across communities."
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              Religion
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
            emptyHint="Open to all religions"
            searchable
            onChange={(religions) => set({ religions })}
          />

          <div className="flex items-center justify-between pt-1">
            <span className="text-sm font-medium text-foreground">
              Caste / Community
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
            emptyHint="Open to all castes"
            searchable
            searchPlaceholder="Search caste / community"
            onChange={(castes) => set({ castes })}
          />
        </div>
      </Section>

      <Section
        title="Marital status & mother tongue"
        description="Choose any that apply, or stay open to all."
      >
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                Marital status
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
                Mother tongue
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
              searchPlaceholder="Search language"
              onChange={(motherTongues) => set({ motherTongues })}
            />
          </div>
        </div>
      </Section>

      <Section
        title="Education"
        description="Preferred qualification levels."
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              Education
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
        </div>
      </Section>

      <Section
        title="Location"
        description="Preferred cities. Leave “Open to all” on to match anywhere."
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              Preferred cities
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
            emptyHint="Open to all locations"
            searchable
            searchPlaceholder="Search city"
            onChange={(cities) => set({ cities })}
          />
        </div>
      </Section>

      {/* Sticky submit — full-width on mobile */}
      <div className="sticky bottom-0 -mx-4 border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:pt-1">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <p className="hidden text-sm text-muted-foreground sm:mr-auto sm:block">
            You can change these any time from your account.
          </p>
          <Button
            type="submit"
            size="lg"
            loading={saving}
            className="w-full sm:w-auto"
          >
            {!saving && <Icon name="check" size={18} />}
            Save preferences
          </Button>
        </div>
      </div>

      <Toaster toasts={toasts} onDismiss={dismissToast} />
    </form>
  )
}
