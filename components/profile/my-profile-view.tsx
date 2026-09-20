'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import type { PhotoResponse, UserProfile } from '@matrimony/shared-core'

import { Button, buttonVariants } from '@/components/ui/button'
import { Icon, type IconName } from '@/components/ui/icon'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/ui/status-badge'
import { cn } from '@/lib/utils'
import { flattenProfileResponse } from '@/src/lib/adapters'
import { photoApi, profileApi } from '@/src/lib/api'
import { BIRTH_ORDER_OPTIONS } from '@/src/data/panchangamData'
import { HoroscopeChartsDisplay } from '@/components/horoscope/horoscope-charts-display'

type FieldValue = string | number | boolean | null | undefined

type TFunc = ReturnType<typeof useTranslation>['t']

interface ProfileField {
  labelKey: string
  value: FieldValue
}

interface ProfileSection {
  key: string
  titleKey: string
  icon: IconName
  emptyHintKey: string
  fields: ProfileField[]
}

/** A field is worth rendering only when it has a real value. */
function hasValue(value: FieldValue): boolean {
  return value !== null && value !== undefined && value !== ''
}

/** Format enums (UNDER_SCORE → words), booleans (Yes/No), numbers, strings. */
function formatValue(value: FieldValue, t: TFunc): string {
  if (typeof value === 'boolean') return value ? t('page.myProfile.yes') : t('page.myProfile.no')
  if (typeof value === 'number') return value.toString()
  return String(value).replace(/_/g, ' ')
}

/** Human label for a stored birth-order token (FIRST → "First"), or null. */
function birthOrderLabel(value: string | null | undefined): string | null {
  if (!value) return null
  return BIRTH_ORDER_OPTIONS.find((o) => o.value === value)?.label ?? value
}

/** "2 (1 married)" style sibling summary, or null when there are none listed. */
function siblingSummary(count: number | null | undefined, married: number | null | undefined, t: TFunc): string | null {
  if (count == null) return null
  return married ? t('page.myProfile.siblingSummary', { count, married }) : `${count}`
}

function buildSections(profile: UserProfile, t: TFunc): ProfileSection[] {
  return [
    {
      key: 'basic',
      titleKey: 'page.myProfile.secBasic',
      icon: 'user',
      emptyHintKey: 'page.myProfile.secBasicHint',
      fields: [
        { labelKey: 'page.myProfile.f.dateOfBirth', value: profile.dateOfBirth },
        { labelKey: 'page.myProfile.f.age', value: profile.age },
        { labelKey: 'page.myProfile.f.gender', value: profile.gender },
        { labelKey: 'page.myProfile.f.maritalStatus', value: profile.maritalStatus },
        { labelKey: 'page.myProfile.f.motherTongue', value: profile.motherTongue },
        { labelKey: 'page.myProfile.f.aboutMe', value: profile.aboutMe },
      ],
    },
    {
      key: 'religious',
      titleKey: 'page.myProfile.secReligious',
      icon: 'sparkles',
      emptyHintKey: 'page.myProfile.secReligiousHint',
      fields: [
        { labelKey: 'page.myProfile.f.religion', value: profile.religion },
        { labelKey: 'page.myProfile.f.sect', value: profile.sect },
        { labelKey: 'page.myProfile.f.caste', value: profile.caste },
        { labelKey: 'page.myProfile.f.subCaste', value: profile.subCaste },
        { labelKey: 'page.myProfile.f.gothram', value: profile.gothram },
        { labelKey: 'page.myProfile.f.manglik', value: profile.manglik },
        { labelKey: 'page.myProfile.f.openReligions', value: profile.canConsiderOtherReligion },
        { labelKey: 'page.myProfile.f.openCastes', value: profile.canConsiderOtherCaste },
      ],
    },
    {
      key: 'professional',
      titleKey: 'page.myProfile.secProfessional',
      icon: 'layers',
      emptyHintKey: 'page.myProfile.secProfessionalHint',
      fields: [
        { labelKey: 'page.myProfile.f.education', value: profile.highestEducation },
        { labelKey: 'page.myProfile.f.educationDetail', value: profile.educationDetail },
        { labelKey: 'page.myProfile.f.employmentType', value: profile.employmentType },
        { labelKey: 'page.myProfile.f.profession', value: profile.profession },
        { labelKey: 'page.myProfile.f.company', value: profile.companyName },
        {
          labelKey: 'page.myProfile.f.annualIncome',
          value: profile.annualIncome ? `₹${profile.annualIncome.toLocaleString('en-IN')}` : null,
        },
        { labelKey: 'page.myProfile.f.workLocation', value: profile.workLocation },
      ],
    },
    {
      key: 'location',
      titleKey: 'page.myProfile.secLocation',
      icon: 'map-pin',
      emptyHintKey: 'page.myProfile.secLocationHint',
      fields: [
        { labelKey: 'page.myProfile.f.currentCity', value: profile.currentCity },
        { labelKey: 'page.myProfile.f.currentState', value: profile.currentState },
        { labelKey: 'page.myProfile.f.currentCountry', value: profile.currentCountry },
        { labelKey: 'page.myProfile.f.nativeCity', value: profile.nativeCity },
        { labelKey: 'page.myProfile.f.nativeState', value: profile.nativeState },
        { labelKey: 'page.myProfile.f.nativeCountry', value: profile.nativeCountry },
        { labelKey: 'page.myProfile.f.citizenship', value: profile.citizenshipCountry },
        { labelKey: 'page.myProfile.f.residencyStatus', value: profile.residencyStatus },
      ],
    },
    {
      key: 'physical',
      titleKey: 'page.myProfile.secPhysical',
      icon: 'user',
      emptyHintKey: 'page.myProfile.secPhysicalHint',
      fields: [
        { labelKey: 'page.myProfile.f.height', value: profile.heightCm ? `${profile.heightCm} cm` : null },
        { labelKey: 'page.myProfile.f.weight', value: profile.weightKg ? `${profile.weightKg} kg` : null },
        { labelKey: 'page.myProfile.f.bloodGroup', value: profile.bloodGroup },
        { labelKey: 'page.myProfile.f.complexion', value: profile.complexion },
        { labelKey: 'page.myProfile.f.bodyType', value: profile.bodyType },
        { labelKey: 'page.myProfile.f.physicalStatus', value: profile.physicalStatus },
      ],
    },
    {
      key: 'family',
      titleKey: 'page.myProfile.secFamily',
      icon: 'users',
      emptyHintKey: 'page.myProfile.secFamilyHint',
      fields: [
        { labelKey: 'page.myProfile.f.father', value: profile.fatherStatus },
        { labelKey: 'page.myProfile.f.fatherProfession', value: profile.fatherProfession },
        { labelKey: 'page.myProfile.f.mother', value: profile.motherStatus },
        { labelKey: 'page.myProfile.f.motherProfession', value: profile.motherProfession },
        { labelKey: 'page.myProfile.f.brothers', value: siblingSummary(profile.noOfBrothers, profile.brothersMarried, t) },
        { labelKey: 'page.myProfile.f.sisters', value: siblingSummary(profile.noOfSisters, profile.sistersMarried, t) },
        { labelKey: 'page.myProfile.f.birthOrder', value: birthOrderLabel(profile.birthOrder) },
        { labelKey: 'page.myProfile.f.familyType', value: profile.familyType },
        { labelKey: 'page.myProfile.f.familyStatus', value: profile.familyStatus },
        { labelKey: 'page.myProfile.f.assets', value: profile.assetDetails },
        { labelKey: 'page.myProfile.f.ownHouse', value: profile.ownHouse ? t('page.myProfile.yes') : null },
        { labelKey: 'page.myProfile.f.nativePlace', value: profile.nativePlace },
      ],
    },
    {
      key: 'horoscope',
      titleKey: 'page.myProfile.secHoroscope',
      icon: 'star',
      emptyHintKey: 'page.myProfile.secHoroscopeHint',
      fields: [
        { labelKey: 'page.myProfile.f.raasi', value: profile.raasi },
        { labelKey: 'page.myProfile.f.nakshatra', value: profile.nakshatra },
        { labelKey: 'page.myProfile.f.dhosam', value: profile.dhosam },
        { labelKey: 'page.myProfile.f.lagnam', value: profile.lagnam },
        { labelKey: 'page.myProfile.f.birthTime', value: profile.birthTime },
        { labelKey: 'page.myProfile.f.birthCity', value: profile.birthCity },
        { labelKey: 'page.myProfile.f.tamilYear', value: profile.tamilYear },
        { labelKey: 'page.myProfile.f.tamilMonth', value: profile.tamilMonth },
        { labelKey: 'page.myProfile.f.tamilDate', value: profile.tamilDate },
        { labelKey: 'page.myProfile.f.kilamai', value: profile.kilamai },
        { labelKey: 'page.myProfile.f.horoscopeAvailable', value: profile.horoscopeAvailable },
        { labelKey: 'page.myProfile.f.willingToShare', value: profile.willingToShareHoroscope },
      ],
    },
  ]
}

/** Section-scoped edit page; each profile section deep-links to its own tab. */
function editPath(section?: string): string {
  return section ? `/profile/edit?section=${section}` : '/profile/edit'
}

export function MyProfileView() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [photos, setPhotos] = useState<PhotoResponse[]>([])
  const [horoscopePhotos, setHoroscopePhotos] = useState<PhotoResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const [profileRes, photosRes, horoscopeRes] = await Promise.all([
        profileApi.getProfile(),
        photoApi.listPhotos(),
        photoApi.listHoroscopePhotos(),
      ])
      setProfile(flattenProfileResponse(profileRes.data as unknown as Record<string, unknown>))
      setPhotos((photosRes.data ?? []).filter((p) => !p.isDeleted))
      setHoroscopePhotos((horoscopeRes.data ?? []).filter((p) => !p.isDeleted))
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-10">
        <div className="space-y-6">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </main>
    )
  }

  if (error || !profile) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-10">
        <div
          role="alert"
          className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 px-6 py-10 text-center"
        >
          <Icon name="alert-circle" size={28} className="text-destructive" />
          <div>
            <p className="font-medium text-foreground">{t('page.myProfile.errorTitle')}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t('page.myProfile.errorDesc')}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => void load()}>
            {t('page.myProfile.retry')}
          </Button>
        </div>
      </main>
    )
  }

  const sections = buildSections(profile, t)
  const primaryPhoto = photos.find((p) => p.isPrimary && p.photoUrl) ?? photos.find((p) => p.photoUrl)
  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim() || profile.profileId
  const completion = profile.profileCompletionPct ?? 0

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-10">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="font-serif text-2xl text-foreground sm:text-3xl">{t('page.myProfile.title')}</h1>
        <Link href={editPath('basic')} className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }))}>
          <Icon name="edit" size={16} />
          {t('page.myProfile.editProfile')}
        </Link>
      </div>

      {/* Header card */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-muted">
              {primaryPhoto?.photoUrl ? (
                <img
                  src={primaryPhoto.photoUrl}
                  alt={fullName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <Icon name="user" size={34} />
                </span>
              )}
            </span>
            <div className="min-w-0">
              <h2 className="truncate font-serif text-xl text-foreground">{fullName}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusBadge status={profile.status} />
                <span className="text-sm text-muted-foreground">{t('page.myProfile.idPrefix')} {profile.profileId}</span>
                {profile.verified ? (
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-success">
                    <Icon name="circle-check" size={16} />
                    {t('page.myProfile.verified')}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="sm:w-56">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('page.myProfile.completion')}</span>
              <span className="text-sm font-semibold text-foreground">{completion}%</span>
            </div>
            <div
              className="mt-2 h-2 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={completion}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={t('page.myProfile.completion')}
            >
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-500"
                style={{ width: `${completion}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Photos */}
      <section className="mt-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-serif text-lg text-foreground">
            <span className="text-primary">
              <Icon name="photo" size={18} />
            </span>
            {t('page.myProfile.photos')}
          </h2>
          <Link href="/photos" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
            {t('page.myProfile.managePhotos')}
          </Link>
        </div>

        {photos.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            {t('page.myProfile.noPhotos')}
          </p>
        ) : (
          <div className="mt-4 flex flex-wrap gap-3">
            {photos.map((photo) => (
              <div
                key={photo.photoId}
                className="relative h-28 w-28 overflow-hidden rounded-xl border border-border bg-muted"
              >
                {photo.photoUrl ? (
                  <img
                    src={photo.thumbnailUrl ?? photo.photoUrl}
                    alt={t('page.myProfile.photos')}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center px-2 text-center text-xs text-muted-foreground">
                    {t('page.myProfile.processing')}
                  </span>
                )}
                {photo.isPrimary && (
                  <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-card/90 px-2 py-0.5 text-xs font-medium text-gold shadow-sm">
                    <Icon name="star-filled" size={12} />
                    {t('page.myProfile.primary')}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {horoscopePhotos.length > 0 && (
          <div className="mt-6 border-t border-border/70 pt-5">
            <h3 className="text-sm font-semibold text-foreground">{t('page.myProfile.horoscopeCharts')}</h3>
            <div className="mt-3 flex flex-wrap gap-3">
              {horoscopePhotos.map((photo) => (
                <div
                  key={photo.photoId}
                  className="relative h-32 w-32 overflow-hidden rounded-xl border border-border bg-muted"
                >
                  {photo.photoUrl ? (
                    <img
                      src={photo.thumbnailUrl ?? photo.photoUrl}
                      alt={t('page.myProfile.horoscopeCharts')}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center px-2 text-center text-xs text-muted-foreground">
                      {t('page.myProfile.processing')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Detail sections */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {sections.map((section) => {
          const visibleFields = section.fields.filter((f) => hasValue(f.value))
          return (
            <section key={section.key} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 font-serif text-lg text-foreground">
                  <span className="text-primary">
                    <Icon name={section.icon} size={18} />
                  </span>
                  {t(section.titleKey as never)}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(editPath(section.key))}
                  aria-label={t('page.myProfile.editSectionAria', { section: t(section.titleKey as never) })}
                >
                  <Icon name="edit" size={16} />
                  {t('page.myProfile.edit')}
                </Button>
              </div>

              {visibleFields.length > 0 ? (
                <dl className="mt-4 grid gap-x-4 gap-y-3">
                  {visibleFields.map((field) => (
                    <div
                      key={field.labelKey}
                      className="flex items-baseline justify-between gap-4 border-b border-border/60 pb-3 last:border-0 last:pb-0"
                    >
                      <dt className="shrink-0 text-sm text-muted-foreground">{t(field.labelKey as never)}</dt>
                      <dd className="min-w-0 text-right text-sm font-medium text-foreground text-pretty">
                        {formatValue(field.value, t)}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">{t(section.emptyHintKey as never)}</p>
              )}

              {section.key === 'horoscope' && (
                <div className="mt-4">
                  <HoroscopeChartsDisplay />
                </div>
              )}
            </section>
          )
        })}
      </div>
    </main>
  )
}
