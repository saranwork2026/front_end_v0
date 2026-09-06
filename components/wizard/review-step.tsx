'use client'

import { useEffect, useState } from 'react'
import type { PhotoResponse } from '@matrimony/shared-core'

import { Icon } from '@/components/ui/icon'
import { photoApi } from '@/src/lib/api'
import {
  bloodGroupOptions,
  bodyTypeOptions,
  complexionOptions,
  dhosamOptions,
  educationOptions,
  employedInOptions,
  familyTypeOptions,
  familyValuesOptions,
  genderOptions,
  manglikOptions,
  maritalOptions,
  parentStatusOptions,
  physicalStatusOptions,
  residencyStatusOptions,
  steps,
  type Opt,
  type StepKey,
  type WizardForm,
} from '@/lib/wizard-data'

interface ReviewStepProps {
  form: WizardForm
  onChangeStep: (key: StepKey) => void
}

interface ReviewRow {
  label: string
  value?: string
}

/** Resolve a stored enum value to its human label for the review display. */
const lbl = (opts: Opt[], v: string): string => opts.find((o) => o.value === v)?.label ?? v

function educationLabel(code: string): string | undefined {
  return educationOptions.find((o) => o.value === code)?.label
}

export function ReviewStep({ form, onChangeStep }: ReviewStepProps) {
  // Photos are a separate resource uploaded directly via photoApi (not part of
  // the wizard form), so the review summary reflects what's actually uploaded.
  const [photos, setPhotos] = useState<PhotoResponse[]>([])
  const [horoscopePhotos, setHoroscopePhotos] = useState<PhotoResponse[]>([])

  useEffect(() => {
    let cancelled = false
    Promise.all([
      photoApi.listPhotos().catch(() => ({ data: [] as PhotoResponse[] })),
      photoApi.listHoroscopePhotos().catch(() => ({ data: [] as PhotoResponse[] })),
    ]).then(([p, h]) => {
      if (cancelled) return
      setPhotos((p.data ?? []).filter((x) => !x.isDeleted))
      setHoroscopePhotos((h.data ?? []).filter((x) => !x.isDeleted))
    })
    return () => {
      cancelled = true
    }
  }, [])

  const sections: {
    key: StepKey
    title: string
    icon: (typeof steps)[number]['icon']
    rows: ReviewRow[]
  }[] = [
    {
      key: 'basic',
      title: 'Basic details',
      icon: 'user',
      rows: [
        { label: 'Name', value: [form.firstName, form.lastName].filter(Boolean).join(' ') },
        { label: 'Date of birth', value: form.dob },
        { label: 'Gender', value: form.gender ? lbl(genderOptions, form.gender) : undefined },
        { label: 'Marital status', value: form.maritalStatus ? lbl(maritalOptions, form.maritalStatus) : undefined },
        { label: 'Mother tongue', value: form.motherTongue },
      ],
    },
    {
      key: 'religious',
      title: 'Religious background',
      icon: 'sparkles',
      rows: [
        { label: 'Religion', value: form.religion },
        { label: 'Sect', value: form.sect },
        { label: 'Caste / community', value: form.caste },
        { label: 'Sub caste', value: form.subCaste },
        { label: 'Gothram', value: form.gothram },
        { label: 'Manglik', value: form.manglik ? lbl(manglikOptions, form.manglik) : undefined },
        { label: 'Open to other religion', value: form.openToOtherReligion === 'true' ? 'Yes' : form.openToOtherReligion === 'false' ? 'No' : undefined },
        { label: 'Open to other caste', value: form.openToOtherCaste === 'true' ? 'Yes' : form.openToOtherCaste === 'false' ? 'No' : undefined },
      ],
    },
    {
      key: 'professional',
      title: 'Education & career',
      icon: 'settings',
      rows: [
        { label: 'Education', value: educationLabel(form.education) },
        { label: 'Education detail', value: form.educationDetail },
        { label: 'Profession', value: form.profession },
        { label: 'Employed in', value: form.employedIn ? lbl(employedInOptions, form.employedIn) : undefined },
        {
          label: 'Annual income',
          value: form.annualIncome ? `₹${Number(form.annualIncome).toLocaleString('en-IN')}` : undefined,
        },
        { label: 'Company', value: form.companyName },
        { label: 'Work location', value: form.workLocation },
      ],
    },
    {
      key: 'location',
      title: 'Location',
      icon: 'map-pin',
      rows: [
        {
          label: 'Native place',
          value: [form.nativeCity, form.nativeState, form.nativeCountry]
            .filter(Boolean)
            .join(', '),
        },
        {
          label: 'Current place',
          value: [form.currentCity, form.currentState, form.currentCountry]
            .filter(Boolean)
            .join(', '),
        },
        { label: 'Citizenship', value: form.citizenshipCountry },
        { label: 'Residency status', value: form.residencyStatus ? lbl(residencyStatusOptions, form.residencyStatus) : undefined },
      ],
    },
    {
      key: 'physical',
      title: 'Physical attributes',
      icon: 'heart',
      rows: [
        {
          label: 'Height',
          value: form.heightCm ? `${form.heightCm} cm` : undefined,
        },
        {
          label: 'Weight',
          value: form.weightKg ? `${form.weightKg} kg` : undefined,
        },
        { label: 'Blood group', value: form.bloodGroup ? lbl(bloodGroupOptions, form.bloodGroup) : undefined },
        { label: 'Complexion', value: form.complexion ? lbl(complexionOptions, form.complexion) : undefined },
        { label: 'Physical status', value: form.physicalStatus ? lbl(physicalStatusOptions, form.physicalStatus) : undefined },
        { label: 'Body type', value: form.bodyType ? lbl(bodyTypeOptions, form.bodyType) : undefined },
      ],
    },
    {
      key: 'family',
      title: 'Family',
      icon: 'users',
      rows: [
        { label: 'Family type', value: form.familyType ? lbl(familyTypeOptions, form.familyType) : undefined },
        { label: 'Family status', value: form.familyValues ? lbl(familyValuesOptions, form.familyValues) : undefined },
        { label: "Father's status", value: form.fatherStatus ? lbl(parentStatusOptions, form.fatherStatus) : undefined },
        { label: "Father's profession", value: form.fatherProfession },
        { label: "Mother's status", value: form.motherStatus ? lbl(parentStatusOptions, form.motherStatus) : undefined },
        { label: "Mother's profession", value: form.motherProfession },
        { label: 'Brothers', value: form.brothers },
        { label: 'Brothers married', value: form.brothersMarried },
        { label: 'Sisters', value: form.sisters },
        { label: 'Sisters married', value: form.sistersMarried },
        { label: 'Asset details', value: form.assetDetails },
      ],
    },
    {
      key: 'horoscope',
      title: 'Horoscope',
      icon: 'star',
      rows: [
        { label: 'Birth time', value: form.birthTime },
        { label: 'Birth city', value: form.birthCity },
        { label: 'Nakshatra', value: form.nakshatra },
        {
          label: 'Padam (Pada)',
          value: form.padam ? `Padam ${form.padam}` : undefined,
        },
        { label: 'Raasi', value: form.raasi },
        { label: 'Dhosam', value: form.dhosam ? lbl(dhosamOptions, form.dhosam) : undefined },
        { label: 'Lagnam', value: form.lagnam },
        {
          label: 'Horoscope available',
          value: form.horoscopeAvailable ? 'Yes' : undefined,
        },
        {
          label: 'Willing to share',
          value: form.willingToShareHoroscope ? 'Yes' : undefined,
        },
      ],
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* Photos summary */}
      <section className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 font-medium text-foreground">
            <Icon name="camera" size={17} className="text-primary" />
            Photos
          </h3>
          <button
            type="button"
            onClick={() => onChangeStep('photos')}
            className="rounded-md text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Change
          </button>
        </div>
        {photos.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {photos.map((photo) => (
              <div key={photo.photoId} className="flex flex-col items-center gap-1">
                <div className="relative size-16 overflow-hidden rounded-lg border border-border bg-muted">
                  {photo.photoUrl ? (
                    <img
                      src={photo.thumbnailUrl ?? photo.photoUrl}
                      alt="Profile photo"
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-center text-[9px] text-muted-foreground">
                      Processing…
                    </span>
                  )}
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground">
                  {photo.isPrimary ? 'Primary' : photo.status.replace(/_/g, ' ').toLowerCase()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No photos added yet.</p>
        )}
      </section>

      {sections.map((section) => {
        const filled = section.rows.filter((r) => r.value && r.value.trim())
        return (
          <section
            key={section.key}
            className="rounded-xl border border-border bg-card p-4"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 font-medium text-foreground">
                <Icon name={section.icon} size={17} className="text-primary" />
                {section.title}
              </h3>
              <button
                type="button"
                onClick={() => onChangeStep(section.key)}
                className="rounded-md text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Change
              </button>
            </div>
            {filled.length > 0 ? (
              <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                {filled.map((row) => (
                  <div
                    key={row.label}
                    className="flex justify-between gap-3 border-b border-border/60 py-1 last:border-0 sm:border-0"
                  >
                    <dt className="text-sm text-muted-foreground">
                      {row.label}
                    </dt>
                    <dd className="text-right text-sm font-medium text-foreground">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : section.key === 'horoscope' && horoscopePhotos.length > 0 ? null : (
              <p className="text-sm text-muted-foreground">
                Not provided yet.
              </p>
            )}
            {section.key === 'horoscope' && horoscopePhotos.length > 0 && (
              <div className="mt-3 flex items-center gap-3 border-t border-border/60 pt-3">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                  {horoscopePhotos[0].photoUrl ? (
                    <img
                      src={horoscopePhotos[0].thumbnailUrl ?? horoscopePhotos[0].photoUrl}
                      alt="Horoscope chart"
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-center text-[9px] text-muted-foreground">
                      Processing…
                    </span>
                  )}
                </div>
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Icon name="circle-check" size={15} className="text-primary" />
                  {horoscopePhotos.length === 1
                    ? 'Horoscope chart attached'
                    : `${horoscopePhotos.length} horoscope charts attached`}
                </span>
              </div>
            )}
          </section>
        )
      })}

      {form.aboutMe.trim() && (
        <section className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-2 font-medium text-foreground">About me</h3>
          <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
            {form.aboutMe}
          </p>
        </section>
      )}
    </div>
  )
}
