'use client'

import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Skeleton } from '@/components/ui/skeleton'
import { Toaster, type ToastItem } from '@/components/ui/toast'
import { StepFields } from '@/components/wizard/step-fields'
import {
  emptyForm,
  saveStep,
  seedFromProfile,
  validateStep,
  type FieldErrors,
  type WizardForm,
} from '@/lib/wizard-data'
import { flattenProfileResponse } from '@/src/lib/adapters'
import { profileApi } from '@/src/lib/api'

/**
 * The seven editable profile sections (matches backend ProfileSection and the
 * wizard's data steps). Photos are managed on /photos, not here.
 */
export type EditSectionKey =
  | 'basic'
  | 'religious'
  | 'professional'
  | 'location'
  | 'physical'
  | 'family'
  | 'horoscope'

const SECTION_META: Record<EditSectionKey, { title: string; description: string }> = {
  basic: { title: 'Basic details', description: 'Your name, date of birth, and the essentials.' },
  religious: { title: 'Religious background', description: 'Community and religious details.' },
  professional: { title: 'Education & career', description: 'Your qualifications and profession.' },
  location: { title: 'Location', description: 'Your native and current location.' },
  physical: { title: 'Physical attributes', description: 'Height, weight, and other details.' },
  family: { title: 'Family details', description: 'About your family and values.' },
  horoscope: { title: 'Horoscope', description: 'Birth-chart details.' },
}

const VALID_SECTIONS = Object.keys(SECTION_META) as EditSectionKey[]

export function normalizeSection(raw: string | undefined): EditSectionKey {
  return raw && VALID_SECTIONS.includes(raw as EditSectionKey) ? (raw as EditSectionKey) : 'basic'
}

interface ProfileEditViewProps {
  section: EditSectionKey
}

/**
 * Section-scoped profile edit page (`/profile/edit?section=`). Reuses the same
 * StepFields + per-section save/seed helpers as the wizard, so the fields and
 * option lists stay in sync across the wizard, this edit page, and partner
 * preferences (business rule: the three profile surfaces must not drift).
 * Loads the current profile, seeds only the chosen section's fields, saves via
 * profileApi.save* (through saveStep), then returns to /profile.
 */
export function ProfileEditView({ section }: ProfileEditViewProps) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [saving, setSaving] = useState(false)
  const [approved, setApproved] = useState(false)
  const [form, setForm] = useState<WizardForm>({ ...emptyForm })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const meta = SECTION_META[section]

  function pushToast(message: string, variant: ToastItem['variant']) {
    setToasts((t) => [...t, { id: Date.now() + Math.floor(Math.random() * 1000), message, variant }])
  }

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await profileApi.getProfile()
      const flat = flattenProfileResponse(res.data as unknown as Record<string, unknown>)
      setForm(seedFromProfile(flat))
      setApproved(flat.status === 'APPROVED')
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  function patchForm(patch: Partial<WizardForm>) {
    setForm((f) => ({ ...f, ...patch }))
    setErrors((e) => {
      const next = { ...e }
      for (const key of Object.keys(patch)) delete next[key as keyof WizardForm]
      return next
    })
  }

  async function handleSave() {
    const validationErrors = validateStep(section, form)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    setSaving(true)
    try {
      await saveStep(section, form)
      pushToast('Your changes have been saved.', 'success')
      navigate('/profile')
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'We could not save your changes. Please try again.'
      pushToast(message, 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-10">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="mt-6 h-72 w-full rounded-2xl" />
      </main>
    )
  }

  if (error) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-10">
        <div
          role="alert"
          className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 px-6 py-10 text-center"
        >
          <Icon name="alert-circle" size={28} className="text-destructive" />
          <div>
            <p className="font-medium text-foreground">We couldn&apos;t load your profile</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Please check your connection and try again.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => void load()}>
            Retry
          </Button>
        </div>
      </main>
    )
  }

  return (
    <>
      <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-10">
        <header className="mb-6">
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Icon name="arrow-left" size={15} />
            Back to profile
          </button>
          <h1 className="mt-2 font-serif text-2xl text-foreground text-balance sm:text-3xl">
            Edit {meta.title.toLowerCase()}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{meta.description}</p>
        </header>

        {approved && (
          <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-gold/40 bg-gold-soft/60 px-4 py-3 text-sm text-foreground">
            <Icon name="alert-circle" size={16} className="mt-0.5 shrink-0 text-gold" />
            <p>
              Editing an approved profile sends it back for review before your changes go live.
            </p>
          </div>
        )}

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <StepFields step={section} form={form} errors={errors} onChange={patchForm} />

          <div className="mt-6 flex items-center gap-3 border-t border-border pt-5">
            <Button onClick={handleSave} loading={saving}>
              Save changes
            </Button>
            <Button variant="secondary" onClick={() => navigate('/profile')} disabled={saving}>
              Cancel
            </Button>
          </div>
        </section>
      </main>
      <Toaster toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
    </>
  )
}
