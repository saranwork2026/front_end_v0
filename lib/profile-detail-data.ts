import type { useTranslation } from 'react-i18next'

import type { IconName } from '@/components/ui/icon'
import type { UserProfile, PhotoResponse } from '@matrimony/shared-core'
import { optionLabel } from '@/src/i18n/optionLabel'

type TFunc = ReturnType<typeof useTranslation>['t']

/**
 * Profile-detail view model for /profile/[profileId].
 *
 * This is the shape the detail sub-components (ProfileHero, DetailSections,
 * ContactPanel, PhotoGallery) render. It is populated from the REAL
 * `UserProfile` (profileApi.getProfileById) plus photo/contact data via
 * `toProfileDetail` — no mock catalogue. Only fields the real profile page
 * already renders across its 7 sections are included.
 */
export interface ProfileDetail {
  profileId: string
  firstName: string
  lastName?: string
  age?: number
  gender?: string
  maritalStatus?: string
  motherTongue?: string
  religion?: string
  caste?: string
  manglik?: string
  currentCity?: string
  state?: string
  country?: string
  heightCm?: number
  highestEducation?: string
  profession?: string
  annualIncome?: number
  nakshatra?: string
  raasi?: string
  dhosam?: string
  verified?: boolean
  featured?: boolean
  matchScore?: number
  aboutMe?: string
  /* Physical */
  diet?: string
  bodyType?: string
  complexion?: string
  /* Professional */
  employedIn?: string
  companyName?: string
  /* Family */
  familyType?: string
  familyStatus?: string
  fatherOccupation?: string
  motherOccupation?: string
  siblings?: string
  nativePlace?: string
  /* Media + privacy gates */
  photos: string[]
  /** CSS object-position for the hero avatar (member-set DP focal point). */
  avatarPosition?: string
  photosLocked: boolean
  horoscopePhotoCount: number
  contact: { phone: string; email: string }
}

/* ---------------------------- helpers ---------------------------- */

function siblingSummary(p: UserProfile): string | undefined {
  const parts: string[] = []
  if (typeof p.noOfBrothers === 'number' && p.noOfBrothers > 0) {
    parts.push(`${p.noOfBrothers} brother${p.noOfBrothers === 1 ? '' : 's'}${
      typeof p.brothersMarried === 'number' ? ` (${p.brothersMarried} married)` : ''
    }`)
  }
  if (typeof p.noOfSisters === 'number' && p.noOfSisters > 0) {
    parts.push(`${p.noOfSisters} sister${p.noOfSisters === 1 ? '' : 's'}${
      typeof p.sistersMarried === 'number' ? ` (${p.sistersMarried} married)` : ''
    }`)
  }
  if (parts.length === 0) return undefined
  return parts.join(', ')
}

interface ExtraDetailData {
  /** Visible profile photo URLs (from photoApi.getPhotosForProfile). */
  photoUrls?: string[]
  /** True when the viewer isn't allowed to see photos yet. */
  photosLocked?: boolean
  horoscopePhotoCount?: number
  /** CSS object-position for the hero avatar (primary photo's focal point). */
  avatarPosition?: string
  /** Revealed contact (after unlock); blank until then. */
  contact?: { phone: string; email: string }
}

/** Adapt the real UserProfile (+ photos/contact) into the detail view model. */
export function toProfileDetail(p: UserProfile, extra: ExtraDetailData = {}): ProfileDetail {
  return {
    profileId: p.profileId,
    firstName: p.firstName,
    lastName: p.lastName,
    age: p.age,
    // Carry RAW stored enum values; buildDetailSections(p, t) localizes each
    // via optionLabel so the DISPLAY label switches with language (NFR-1: the
    // stored value is unchanged). Free text (profession/company/native/aboutMe)
    // and religion/caste/motherTongue/nakshatra/raasi/education stay raw too.
    gender: p.gender,
    maritalStatus: p.maritalStatus,
    motherTongue: p.motherTongue,
    religion: p.religion,
    caste: p.caste,
    manglik: p.manglik,
    currentCity: p.currentCity,
    state: p.currentState,
    country: p.currentCountry,
    heightCm: p.heightCm,
    highestEducation: p.highestEducation,
    profession: p.profession,
    annualIncome: p.annualIncome,
    nakshatra: p.nakshatra,
    raasi: p.raasi,
    dhosam: p.dhosam,
    verified: p.verified ?? undefined,
    matchScore: p.matchScore ?? undefined,
    aboutMe: p.aboutMe,
    diet: undefined,
    bodyType: p.bodyType,
    complexion: p.complexion,
    employedIn: p.employmentType,
    companyName: p.companyName,
    familyType: p.familyType,
    familyStatus: p.familyStatus,
    // Free-text profession wins; otherwise carry the RAW parentStatus enum so
    // step-3 can localize it (a free-text profession never collides with the 5
    // parentStatus enum keys, so it falls through optionLabel's `?? value`).
    fatherOccupation: p.fatherProfession || p.fatherStatus,
    motherOccupation: p.motherProfession || p.motherStatus,
    siblings: siblingSummary(p),
    nativePlace: p.nativePlace || p.nativeCity,
    photos: extra.photoUrls ?? [],
    photosLocked: extra.photosLocked ?? (extra.photoUrls?.length ?? 0) === 0,
    horoscopePhotoCount: extra.horoscopePhotoCount ?? 0,
    avatarPosition: extra.avatarPosition,
    contact: extra.contact ?? { phone: '', email: '' },
  }
}

/** Extract visible photo URLs from a PhotoResponse[] (skips blurred/locked). */
export function visiblePhotoUrls(photos: PhotoResponse[]): string[] {
  return photos
    .filter((ph) => !ph.isDeleted && !ph.isBlurred && ph.photoUrl)
    .map((ph) => ph.photoUrl as string)
}

/* ------------------------- detail section model ------------------------ */

export interface DetailRow {
  /** i18n KEY (e.g. 'page.profile.dsAge'); the caller resolves via t(). */
  label: string
  value?: string | number
}
export interface DetailSection {
  key: string
  /** i18n KEY (e.g. 'page.profile.dsSecBasic'); the caller resolves via t(). */
  title: string
  icon: IconName
  rows: DetailRow[]
}

function cmToFeet(cm?: number): string | undefined {
  if (!cm) return undefined
  const total = cm / 2.54
  return `${Math.floor(total / 12)}'${Math.round(total % 12)}" (${cm} cm)`
}

/**
 * Build the profile detail sections. `title` and each row `label` hold i18n
 * KEYS resolved by the caller (detail-sections.tsx) via t(). `t` is passed in
 * only to format the age value ('{{count}} yrs'); this module has no React
 * context of its own.
 */
export function buildDetailSections(p: ProfileDetail, t: TFunc): DetailSection[] {
  const sections: DetailSection[] = [
    {
      key: 'basic',
      title: 'page.profile.dsSecBasic',
      icon: 'user',
      rows: [
        { label: 'page.profile.dsAge', value: p.age ? t('page.profile.dsYrs', { count: p.age }) : undefined },
        { label: 'page.profile.dsGender', value: optionLabel(t, 'gender', p.gender) || undefined },
        { label: 'page.profile.dsMaritalStatus', value: optionLabel(t, 'marital', p.maritalStatus) || undefined },
        { label: 'page.profile.dsMotherTongue', value: optionLabel(t, 'motherTongue', p.motherTongue) || undefined },
      ],
    },
    {
      key: 'physical',
      title: 'page.profile.dsSecPhysical',
      icon: 'heart',
      rows: [
        { label: 'page.profile.dsHeight', value: cmToFeet(p.heightCm) },
        { label: 'page.profile.dsBodyType', value: optionLabel(t, 'bodyType', p.bodyType) || undefined },
        { label: 'page.profile.dsComplexion', value: optionLabel(t, 'complexion', p.complexion) || undefined },
      ],
    },
    {
      key: 'religious',
      title: 'page.profile.dsSecReligious',
      icon: 'sparkles',
      rows: [
        { label: 'page.profile.dsReligion', value: optionLabel(t, 'religion', p.religion) || undefined },
        { label: 'page.profile.dsCaste', value: optionLabel(t, 'caste', p.caste, undefined, p.religion) || undefined },
        { label: 'page.profile.dsManglik', value: optionLabel(t, 'manglik', p.manglik) || undefined },
      ],
    },
    {
      key: 'professional',
      title: 'page.profile.dsSecProfessional',
      icon: 'settings',
      rows: [
        { label: 'page.profile.dsEducation', value: optionLabel(t, 'education', p.highestEducation) || undefined },
        { label: 'page.profile.dsProfession', value: p.profession },
        { label: 'page.profile.dsEmployedIn', value: optionLabel(t, 'employedIn', p.employedIn) || undefined },
        { label: 'page.profile.dsCompany', value: p.companyName },
        { label: 'page.profile.dsAnnualIncome', value: p.annualIncome ? `₹${p.annualIncome.toLocaleString('en-IN')}` : undefined },
      ],
    },
    {
      key: 'location',
      title: 'page.profile.dsSecLocation',
      icon: 'globe',
      rows: [
        { label: 'page.profile.dsCity', value: p.currentCity },
        { label: 'page.profile.dsState', value: optionLabel(t, 'state', p.state) || undefined },
        { label: 'page.profile.dsCountry', value: optionLabel(t, 'country', p.country) || undefined },
        { label: 'page.profile.dsNativePlace', value: p.nativePlace },
      ],
    },
    {
      key: 'family',
      title: 'page.profile.dsSecFamily',
      icon: 'users',
      rows: [
        { label: 'page.profile.dsFamilyType', value: optionLabel(t, 'familyType', p.familyType) || undefined },
        { label: 'page.profile.dsFamilyStatus', value: optionLabel(t, 'familyValues', p.familyStatus) || undefined },
        // Free-text profession falls through optionLabel's `?? value`; a raw
        // parentStatus enum localizes via options.parentStatus.
        { label: 'page.profile.dsFatherOccupation', value: optionLabel(t, 'parentStatus', p.fatherOccupation) || undefined },
        { label: 'page.profile.dsMotherOccupation', value: optionLabel(t, 'parentStatus', p.motherOccupation) || undefined },
        { label: 'page.profile.dsSiblings', value: p.siblings },
      ],
    },
    {
      key: 'horoscope',
      title: 'page.profile.dsSecHoroscope',
      icon: 'star',
      rows: [
        { label: 'page.profile.dsNakshatra', value: optionLabel(t, 'nakshatra', p.nakshatra) || undefined },
        { label: 'page.profile.dsRaasi', value: optionLabel(t, 'raasi', p.raasi) || undefined },
        { label: 'page.profile.dsDhosam', value: optionLabel(t, 'dhosam', p.dhosam) || undefined },
      ],
    },
  ]

  return sections
    .map((s) => ({ ...s, rows: s.rows.filter((r) => r.value != null && r.value !== '') }))
    .filter((s) => s.rows.length > 0)
}

// NOTE: dead code (zero call sites in New-FE). Now that ProfileDetail carries
// RAW enum values, this would render raw enum names if ever wired up — it needs
// `t` + `optionLabel` (like buildDetailSections) before any future use.
export function quickFacts(p: ProfileDetail): string[] {
  return [
    p.age ? `${p.age} yrs` : '',
    cmToFeet(p.heightCm)?.split(' ')[0] ?? '',
    p.maritalStatus ?? '',
    p.currentCity ?? '',
    p.religion && p.caste ? `${p.religion} · ${p.caste}` : p.religion ?? '',
  ].filter(Boolean) as string[]
}
