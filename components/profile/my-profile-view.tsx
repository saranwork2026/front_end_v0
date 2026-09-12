'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
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

type FieldValue = string | number | boolean | null | undefined

interface ProfileField {
  label: string
  value: FieldValue
}

interface ProfileSection {
  key: string
  title: string
  icon: IconName
  emptyHint: string
  fields: ProfileField[]
}

/** A field is worth rendering only when it has a real value. */
function hasValue(value: FieldValue): boolean {
  return value !== null && value !== undefined && value !== ''
}

/** Format enums (UNDER_SCORE → words), booleans (Yes/No), numbers, strings. */
function formatValue(value: FieldValue): string {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'number') return value.toString()
  return String(value).replace(/_/g, ' ')
}

/** Human label for a stored birth-order token (FIRST → "First"), or null. */
function birthOrderLabel(value: string | null | undefined): string | null {
  if (!value) return null
  return BIRTH_ORDER_OPTIONS.find((o) => o.value === value)?.label ?? value
}

/** "2 (1 married)" style sibling summary, or null when there are none listed. */
function siblingSummary(count: number | null | undefined, married: number | null | undefined): string | null {
  if (count == null) return null
  return married ? `${count} (${married} married)` : `${count}`
}

function buildSections(profile: UserProfile): ProfileSection[] {
  return [
    {
      key: 'basic',
      title: 'Basic details',
      icon: 'user',
      emptyHint: 'Add your basic details',
      fields: [
        { label: 'Date of birth', value: profile.dateOfBirth },
        { label: 'Age', value: profile.age },
        { label: 'Gender', value: profile.gender },
        { label: 'Marital status', value: profile.maritalStatus },
        { label: 'Mother tongue', value: profile.motherTongue },
        { label: 'About me', value: profile.aboutMe },
      ],
    },
    {
      key: 'religious',
      title: 'Religious background',
      icon: 'sparkles',
      emptyHint: 'Add your religious details',
      fields: [
        { label: 'Religion', value: profile.religion },
        { label: 'Sect', value: profile.sect },
        { label: 'Caste', value: profile.caste },
        { label: 'Sub-caste', value: profile.subCaste },
        { label: 'Gothram', value: profile.gothram },
        { label: 'Manglik', value: profile.manglik },
        { label: 'Open to other religions', value: profile.canConsiderOtherReligion },
        { label: 'Open to other castes', value: profile.canConsiderOtherCaste },
      ],
    },
    {
      key: 'professional',
      title: 'Education & career',
      icon: 'layers',
      emptyHint: 'Add your education and career details',
      fields: [
        { label: 'Highest education', value: profile.highestEducation },
        { label: 'Education detail', value: profile.educationDetail },
        { label: 'Employment type', value: profile.employmentType },
        { label: 'Profession', value: profile.profession },
        { label: 'Company', value: profile.companyName },
        {
          label: 'Annual income',
          value: profile.annualIncome ? `₹${profile.annualIncome.toLocaleString('en-IN')}` : null,
        },
        { label: 'Work location', value: profile.workLocation },
      ],
    },
    {
      key: 'location',
      title: 'Location',
      icon: 'map-pin',
      emptyHint: 'Add your location details',
      fields: [
        { label: 'Current city', value: profile.currentCity },
        { label: 'Current state', value: profile.currentState },
        { label: 'Current country', value: profile.currentCountry },
        { label: 'Native city', value: profile.nativeCity },
        { label: 'Native state', value: profile.nativeState },
        { label: 'Native country', value: profile.nativeCountry },
        { label: 'Citizenship', value: profile.citizenshipCountry },
        { label: 'Residency status', value: profile.residencyStatus },
      ],
    },
    {
      key: 'physical',
      title: 'Physical attributes',
      icon: 'user',
      emptyHint: 'Add your physical attributes',
      fields: [
        { label: 'Height', value: profile.heightCm ? `${profile.heightCm} cm` : null },
        { label: 'Weight', value: profile.weightKg ? `${profile.weightKg} kg` : null },
        { label: 'Blood group', value: profile.bloodGroup },
        { label: 'Complexion', value: profile.complexion },
        { label: 'Body type', value: profile.bodyType },
        { label: 'Physical status', value: profile.physicalStatus },
      ],
    },
    {
      key: 'family',
      title: 'Family',
      icon: 'users',
      emptyHint: 'Add your family details',
      fields: [
        { label: 'Father', value: profile.fatherStatus },
        { label: "Father's profession", value: profile.fatherProfession },
        { label: 'Mother', value: profile.motherStatus },
        { label: "Mother's profession", value: profile.motherProfession },
        { label: 'Brothers', value: siblingSummary(profile.noOfBrothers, profile.brothersMarried) },
        { label: 'Sisters', value: siblingSummary(profile.noOfSisters, profile.sistersMarried) },
        { label: 'Birth order', value: birthOrderLabel(profile.birthOrder) },
        { label: 'Family type', value: profile.familyType },
        { label: 'Family status', value: profile.familyStatus },
        { label: 'Assets', value: profile.assetDetails },
        { label: 'Own house', value: profile.ownHouse ? 'Yes' : null },
        { label: 'Native place', value: profile.nativePlace },
      ],
    },
    {
      key: 'horoscope',
      title: 'Horoscope',
      icon: 'star',
      emptyHint: 'Add your horoscope details',
      fields: [
        { label: 'Raasi', value: profile.raasi },
        { label: 'Nakshatra', value: profile.nakshatra },
        { label: 'Dhosam', value: profile.dhosam },
        { label: 'Lagnam', value: profile.lagnam },
        { label: 'Birth time', value: profile.birthTime },
        { label: 'Birth city', value: profile.birthCity },
        { label: 'Tamil year', value: profile.tamilYear },
        { label: 'Tamil month', value: profile.tamilMonth },
        { label: 'Tamil date', value: profile.tamilDate },
        { label: 'Kilamai', value: profile.kilamai },
        { label: 'Horoscope available', value: profile.horoscopeAvailable },
        { label: 'Willing to share horoscope', value: profile.willingToShareHoroscope },
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
            <p className="font-medium text-foreground">We couldn&apos;t load your profile</p>
            <p className="mt-1 text-sm text-muted-foreground">Please check your connection and try again.</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => void load()}>
            Retry
          </Button>
        </div>
      </main>
    )
  }

  const sections = buildSections(profile)
  const primaryPhoto = photos.find((p) => p.isPrimary && p.photoUrl) ?? photos.find((p) => p.photoUrl)
  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim() || profile.profileId
  const completion = profile.profileCompletionPct ?? 0

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-10">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="font-serif text-2xl text-foreground sm:text-3xl">My profile</h1>
        <Link href={editPath('basic')} className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }))}>
          <Icon name="edit" size={16} />
          Edit profile
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
                <span className="text-sm text-muted-foreground">ID {profile.profileId}</span>
                {profile.verified ? (
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-success">
                    <Icon name="circle-check" size={16} />
                    Verified
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="sm:w-56">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Profile completion</span>
              <span className="text-sm font-semibold text-foreground">{completion}%</span>
            </div>
            <div
              className="mt-2 h-2 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={completion}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Profile completion"
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
            Photos
          </h2>
          <Link href="/photos" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
            Manage photos
          </Link>
        </div>

        {photos.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            You haven&apos;t added any photos yet. Add photos to help members recognise you.
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
                    alt="Profile photo"
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center px-2 text-center text-xs text-muted-foreground">
                    Processing…
                  </span>
                )}
                {photo.isPrimary && (
                  <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-card/90 px-2 py-0.5 text-xs font-medium text-gold shadow-sm">
                    <Icon name="star-filled" size={12} />
                    Primary
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {horoscopePhotos.length > 0 && (
          <div className="mt-6 border-t border-border/70 pt-5">
            <h3 className="text-sm font-semibold text-foreground">Horoscope charts</h3>
            <div className="mt-3 flex flex-wrap gap-3">
              {horoscopePhotos.map((photo) => (
                <div
                  key={photo.photoId}
                  className="relative h-32 w-32 overflow-hidden rounded-xl border border-border bg-muted"
                >
                  {photo.photoUrl ? (
                    <img
                      src={photo.thumbnailUrl ?? photo.photoUrl}
                      alt="Horoscope chart"
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center px-2 text-center text-xs text-muted-foreground">
                      Processing…
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
                  {section.title}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(editPath(section.key))}
                  aria-label={`Edit ${section.title}`}
                >
                  <Icon name="edit" size={16} />
                  Edit
                </Button>
              </div>

              {visibleFields.length > 0 ? (
                <dl className="mt-4 grid gap-x-4 gap-y-3">
                  {visibleFields.map((field) => (
                    <div
                      key={field.label}
                      className="flex items-baseline justify-between gap-4 border-b border-border/60 pb-3 last:border-0 last:pb-0"
                    >
                      <dt className="shrink-0 text-sm text-muted-foreground">{field.label}</dt>
                      <dd className="min-w-0 text-right text-sm font-medium text-foreground text-pretty">
                        {formatValue(field.value)}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">{section.emptyHint}</p>
              )}
            </section>
          )
        })}
      </div>
    </main>
  )
}
