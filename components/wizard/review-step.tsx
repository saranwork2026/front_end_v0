'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
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
      title: t('page.review.secBasic'),
      icon: 'user',
      rows: [
        { label: t('page.review.rName'), value: [form.firstName, form.lastName].filter(Boolean).join(' ') },
        { label: t('page.review.rDob'), value: form.dob },
        { label: t('page.review.rGender'), value: form.gender ? lbl(genderOptions, form.gender) : undefined },
        { label: t('page.review.rMaritalStatus'), value: form.maritalStatus ? lbl(maritalOptions, form.maritalStatus) : undefined },
        { label: t('page.review.rMotherTongue'), value: form.motherTongue },
      ],
    },
    {
      key: 'religious',
      title: t('page.review.secReligious'),
      icon: 'sparkles',
      rows: [
        { label: t('page.review.rReligion'), value: form.religion },
        { label: t('page.review.rSect'), value: form.sect },
        { label: t('page.review.rCaste'), value: form.caste },
        { label: t('page.review.rSubCaste'), value: form.subCaste },
        { label: t('page.review.rGothram'), value: form.gothram },
        { label: t('page.review.rManglik'), value: form.manglik ? lbl(manglikOptions, form.manglik) : undefined },
        { label: t('page.review.rOpenReligion'), value: form.openToOtherReligion === 'true' ? t('page.review.yes') : form.openToOtherReligion === 'false' ? t('page.review.no') : undefined },
        { label: t('page.review.rOpenCaste'), value: form.openToOtherCaste === 'true' ? t('page.review.yes') : form.openToOtherCaste === 'false' ? t('page.review.no') : undefined },
      ],
    },
    {
      key: 'professional',
      title: t('page.review.secProfessional'),
      icon: 'settings',
      rows: [
        { label: t('page.review.rEducation'), value: educationLabel(form.education) },
        { label: t('page.review.rEducationDetail'), value: form.educationDetail },
        { label: t('page.review.rProfession'), value: form.profession },
        { label: t('page.review.rEmployedIn'), value: form.employedIn ? lbl(employedInOptions, form.employedIn) : undefined },
        {
          label: t('page.review.rAnnualIncome'),
          value: form.annualIncome ? `₹${Number(form.annualIncome).toLocaleString('en-IN')}` : undefined,
        },
        { label: t('page.review.rCompany'), value: form.companyName },
        { label: t('page.review.rWorkLocation'), value: form.workLocation },
      ],
    },
    {
      key: 'location',
      title: t('page.review.secLocation'),
      icon: 'map-pin',
      rows: [
        {
          label: t('page.review.rNativePlace'),
          value: [form.nativeCity, form.nativeState, form.nativeCountry]
            .filter(Boolean)
            .join(', '),
        },
        {
          label: t('page.review.rCurrentPlace'),
          value: [form.currentCity, form.currentState, form.currentCountry]
            .filter(Boolean)
            .join(', '),
        },
        { label: t('page.review.rCitizenship'), value: form.citizenshipCountry },
        { label: t('page.review.rResidencyStatus'), value: form.residencyStatus ? lbl(residencyStatusOptions, form.residencyStatus) : undefined },
      ],
    },
    {
      key: 'physical',
      title: t('page.review.secPhysical'),
      icon: 'heart',
      rows: [
        {
          label: t('page.review.rHeight'),
          value: form.heightCm ? `${form.heightCm} cm` : undefined,
        },
        {
          label: t('page.review.rWeight'),
          value: form.weightKg ? `${form.weightKg} kg` : undefined,
        },
        { label: t('page.review.rBloodGroup'), value: form.bloodGroup ? lbl(bloodGroupOptions, form.bloodGroup) : undefined },
        { label: t('page.review.rComplexion'), value: form.complexion ? lbl(complexionOptions, form.complexion) : undefined },
        { label: t('page.review.rPhysicalStatus'), value: form.physicalStatus ? lbl(physicalStatusOptions, form.physicalStatus) : undefined },
        { label: t('page.review.rBodyType'), value: form.bodyType ? lbl(bodyTypeOptions, form.bodyType) : undefined },
      ],
    },
    {
      key: 'family',
      title: t('page.review.secFamily'),
      icon: 'users',
      rows: [
        { label: t('page.review.rFamilyType'), value: form.familyType ? lbl(familyTypeOptions, form.familyType) : undefined },
        { label: t('page.review.rFamilyStatus'), value: form.familyValues ? lbl(familyValuesOptions, form.familyValues) : undefined },
        { label: t('page.review.rFatherStatus'), value: form.fatherStatus ? lbl(parentStatusOptions, form.fatherStatus) : undefined },
        { label: t('page.review.rFatherProfession'), value: form.fatherProfession },
        { label: t('page.review.rMotherStatus'), value: form.motherStatus ? lbl(parentStatusOptions, form.motherStatus) : undefined },
        { label: t('page.review.rMotherProfession'), value: form.motherProfession },
        { label: t('page.review.rBrothers'), value: form.brothers },
        { label: t('page.review.rBrothersMarried'), value: form.brothersMarried },
        { label: t('page.review.rSisters'), value: form.sisters },
        { label: t('page.review.rSistersMarried'), value: form.sistersMarried },
        { label: t('page.review.rAssetDetails'), value: form.assetDetails },
      ],
    },
    {
      key: 'horoscope',
      title: t('page.review.secHoroscope'),
      icon: 'star',
      rows: [
        { label: t('page.review.rBirthTime'), value: form.birthTime },
        { label: t('page.review.rBirthCity'), value: form.birthCity },
        { label: t('page.review.rNakshatra'), value: form.nakshatra },
        {
          label: t('page.review.rPadam'),
          value: form.padam ? t('page.review.rPadamValue', { n: form.padam }) : undefined,
        },
        { label: t('page.review.rRaasi'), value: form.raasi },
        { label: t('page.review.rDhosam'), value: form.dhosam ? lbl(dhosamOptions, form.dhosam) : undefined },
        { label: t('page.review.rLagnam'), value: form.lagnam },
        {
          label: t('page.review.rHoroscopeAvailable'),
          value: form.horoscopeAvailable ? t('page.review.yes') : undefined,
        },
        {
          label: t('page.review.rWillingToShare'),
          value: form.willingToShareHoroscope ? t('page.review.yes') : undefined,
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
            {t('page.review.photos')}
          </h3>
          <button
            type="button"
            onClick={() => onChangeStep('photos')}
            className="rounded-md text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            {t('page.review.change')}
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
                      alt={t('page.review.photos')}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-center text-[9px] text-muted-foreground">
                      {t('page.review.processing')}
                    </span>
                  )}
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground">
                  {photo.isPrimary ? t('page.review.primary') : photo.status.replace(/_/g, ' ').toLowerCase()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t('page.review.noPhotos')}</p>
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
                {t('page.review.change')}
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
                {t('page.review.notProvided')}
              </p>
            )}
            {section.key === 'horoscope' && horoscopePhotos.length > 0 && (
              <div className="mt-3 flex items-center gap-3 border-t border-border/60 pt-3">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                  {horoscopePhotos[0].photoUrl ? (
                    <img
                      src={horoscopePhotos[0].thumbnailUrl ?? horoscopePhotos[0].photoUrl}
                      alt={t('page.review.secHoroscope')}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-center text-[9px] text-muted-foreground">
                      {t('page.review.processing')}
                    </span>
                  )}
                </div>
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Icon name="circle-check" size={15} className="text-primary" />
                  {horoscopePhotos.length === 1
                    ? t('page.review.chartAttached')
                    : t('page.review.chartsAttached', { count: horoscopePhotos.length })}
                </span>
              </div>
            )}
          </section>
        )
      })}

      {form.aboutMe.trim() && (
        <section className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-2 font-medium text-foreground">{t('page.review.aboutMe')}</h3>
          <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
            {form.aboutMe}
          </p>
        </section>
      )}
    </div>
  )
}
