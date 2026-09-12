import type { IconName } from '@/components/ui/icon'
import type { UserProfile, PhotoResponse } from '@matrimony/shared-core'

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

/* ---------------------------- enum → label ---------------------------- */

function humanize(v?: string | null): string | undefined {
  if (!v) return undefined
  return v
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

const EMPLOYMENT_LABEL: Record<string, string> = {
  EMPLOYED_PRIVATE: 'Private sector',
  EMPLOYED_GOVT: 'Government / Public sector',
  SELF_EMPLOYED: 'Self-employed',
  BUSINESS: 'Business',
  FREELANCER: 'Freelancer',
  NOT_WORKING: 'Not working',
}

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
    gender: humanize(p.gender),
    maritalStatus: humanize(p.maritalStatus),
    motherTongue: p.motherTongue,
    religion: p.religion,
    caste: p.caste,
    manglik: humanize(p.manglik),
    currentCity: p.currentCity,
    state: p.currentState,
    country: p.currentCountry,
    heightCm: p.heightCm,
    highestEducation: p.highestEducation,
    profession: p.profession,
    annualIncome: p.annualIncome,
    nakshatra: p.nakshatra,
    raasi: p.raasi,
    dhosam: humanize(p.dhosam),
    verified: p.verified ?? undefined,
    matchScore: p.matchScore ?? undefined,
    aboutMe: p.aboutMe,
    diet: undefined,
    bodyType: humanize(p.bodyType),
    complexion: humanize(p.complexion),
    employedIn: p.employmentType ? EMPLOYMENT_LABEL[p.employmentType] ?? humanize(p.employmentType) : undefined,
    companyName: p.companyName,
    familyType: humanize(p.familyType),
    familyStatus: humanize(p.familyStatus),
    fatherOccupation: p.fatherProfession || humanize(p.fatherStatus),
    motherOccupation: p.motherProfession || humanize(p.motherStatus),
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
  label: string
  value?: string | number
}
export interface DetailSection {
  key: string
  title: string
  icon: IconName
  rows: DetailRow[]
}

function cmToFeet(cm?: number): string | undefined {
  if (!cm) return undefined
  const total = cm / 2.54
  return `${Math.floor(total / 12)}'${Math.round(total % 12)}" (${cm} cm)`
}

export function buildDetailSections(p: ProfileDetail): DetailSection[] {
  const sections: DetailSection[] = [
    {
      key: 'basic',
      title: 'Basic Details',
      icon: 'user',
      rows: [
        { label: 'Age', value: p.age ? `${p.age} yrs` : undefined },
        { label: 'Gender', value: p.gender },
        { label: 'Marital status', value: p.maritalStatus },
        { label: 'Mother tongue', value: p.motherTongue },
      ],
    },
    {
      key: 'physical',
      title: 'Physical Attributes',
      icon: 'heart',
      rows: [
        { label: 'Height', value: cmToFeet(p.heightCm) },
        { label: 'Body type', value: p.bodyType },
        { label: 'Complexion', value: p.complexion },
      ],
    },
    {
      key: 'religious',
      title: 'Religious Background',
      icon: 'sparkles',
      rows: [
        { label: 'Religion', value: p.religion },
        { label: 'Caste / community', value: p.caste },
        { label: 'Manglik / Dhosam', value: p.manglik },
      ],
    },
    {
      key: 'professional',
      title: 'Education & Career',
      icon: 'settings',
      rows: [
        { label: 'Education', value: p.highestEducation },
        { label: 'Profession', value: p.profession },
        { label: 'Employed in', value: p.employedIn },
        { label: 'Company', value: p.companyName },
        { label: 'Annual income', value: p.annualIncome ? `₹${p.annualIncome.toLocaleString('en-IN')}` : undefined },
      ],
    },
    {
      key: 'location',
      title: 'Location',
      icon: 'globe',
      rows: [
        { label: 'City', value: p.currentCity },
        { label: 'State', value: p.state },
        { label: 'Country', value: p.country },
        { label: 'Native place', value: p.nativePlace },
      ],
    },
    {
      key: 'family',
      title: 'Family',
      icon: 'users',
      rows: [
        { label: 'Family type', value: p.familyType },
        { label: 'Family status', value: p.familyStatus },
        { label: "Father's occupation", value: p.fatherOccupation },
        { label: "Mother's occupation", value: p.motherOccupation },
        { label: 'Siblings', value: p.siblings },
      ],
    },
    {
      key: 'horoscope',
      title: 'Horoscope',
      icon: 'star',
      rows: [
        { label: 'Nakshatra', value: p.nakshatra },
        { label: 'Raasi', value: p.raasi },
        { label: 'Dhosam', value: p.dhosam },
      ],
    },
  ]

  return sections
    .map((s) => ({ ...s, rows: s.rows.filter((r) => r.value != null && r.value !== '') }))
    .filter((s) => s.rows.length > 0)
}

export function quickFacts(p: ProfileDetail): string[] {
  return [
    p.age ? `${p.age} yrs` : '',
    cmToFeet(p.heightCm)?.split(' ')[0] ?? '',
    p.maritalStatus ?? '',
    p.currentCity ?? '',
    p.religion && p.caste ? `${p.religion} · ${p.caste}` : p.religion ?? '',
  ].filter(Boolean) as string[]
}
