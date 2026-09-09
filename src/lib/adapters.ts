import type { SearchResult, ActivityStatus, ProfileSection } from '@matrimony/shared-core'
import type { ProfileCardProfile } from '@/components/shared/profile-card'

/**
 * Map the backend's fine-grained ActivityStatus to the coarse 3-state value the
 * v0 ProfileCard understands ('ONLINE' | 'RECENT' | 'UNKNOWN').
 */
export function toCardActivity(
  status?: ActivityStatus | null,
): 'ONLINE' | 'RECENT' | 'UNKNOWN' {
  switch (status) {
    case 'ONLINE_NOW':
      return 'ONLINE'
    case 'ACTIVE_TODAY':
    case 'ACTIVE_THIS_WEEK':
    case 'ACTIVE_RECENTLY':
      return 'RECENT'
    default:
      return 'UNKNOWN'
  }
}

/**
 * Adapt a real SearchResult into the v0 ProfileCard's prop shape. Preserves the
 * real field names/values — only the activityStatus is bucketed and nulls are
 * normalised to undefined for optional card props.
 */
export function toProfileCard(r: SearchResult): ProfileCardProfile {
  return {
    profileId: r.profileId,
    firstName: r.firstName,
    lastName: r.lastName,
    age: r.age,
    currentCity: r.currentCity,
    heightCm: r.heightCm,
    highestEducation: r.highestEducation,
    profession: r.profession,
    religion: r.religion,
    caste: r.caste,
    primaryPhotoUrl: r.primaryPhotoUrl ?? undefined,
    verified: r.verified ?? undefined,
    featured: r.featured ?? undefined,
    matchScore: r.matchScore ?? undefined,
    activityStatus: toCardActivity(r.activityStatus),
  }
}

/** Human labels for the profile sections still missing (strength nudge). */
const SECTION_LABELS: Record<ProfileSection, string> = {
  BASIC: 'Complete your basic details',
  LOCATION: 'Add your location',
  RELIGIOUS: 'Add religious details',
  PROFESSIONAL: 'Add education & profession',
  PHYSICAL: 'Add physical attributes',
  FAMILY: 'Add family details',
  HOROSCOPE: 'Add horoscope details',
}

export function missingSectionLabels(sections?: ProfileSection[] | null): string[] {
  if (!sections) return []
  return sections.map((s) => SECTION_LABELS[s] ?? s)
}

/**
 * Flatten the backend's nested UserProfileResponse (basic/religious/
 * professional/location/physical/family/horoscope sections) into the flat
 * `UserProfile` shape the whole app reads (p.gender, p.caste, p.heightCm, …).
 *
 * The backend groups profile attributes into optional section objects (a
 * section is omitted entirely when the member never filled it). The frontend
 * types and every consumer (wizard seed, profile edit, admin member-detail,
 * profile detail) expect a flat object, so without this flattening only the
 * top-level identity/computed fields (profileId, firstName, age, status…) show
 * and every sectioned field reads as undefined. This adapter bridges the two.
 *
 * Accepts an `unknown`-ish record so it works whether the API returns the
 * nested response or (defensively) an already-flat object.
 */
export function flattenProfileResponse(res: Record<string, unknown>): import('@matrimony/shared-core').UserProfile {
  const basic = (res.basic ?? {}) as Record<string, unknown>
  const religious = (res.religious ?? {}) as Record<string, unknown>
  const professional = (res.professional ?? {}) as Record<string, unknown>
  const location = (res.location ?? {}) as Record<string, unknown>
  const physical = (res.physical ?? {}) as Record<string, unknown>
  const family = (res.family ?? {}) as Record<string, unknown>
  const horoscope = (res.horoscope ?? {}) as Record<string, unknown>

  // Prefer the nested section value, falling back to a top-level value in case
  // the response is already flat (belt-and-suspenders during migration).
  const pick = <T,>(section: Record<string, unknown>, key: string): T | undefined =>
    (section[key] ?? (res as Record<string, unknown>)[key]) as T | undefined

  return {
    ...(res as object),
    // Basic
    dateOfBirth: pick(basic, 'dateOfBirth'),
    gender: pick(basic, 'gender'),
    maritalStatus: pick(basic, 'maritalStatus'),
    motherTongue: pick(basic, 'motherTongue'),
    aboutMe: pick(basic, 'aboutMe'),
    photoVisibility: pick(basic, 'photoVisibility'),
    contactVisibility: pick(basic, 'contactVisibility'),
    // Religious
    religion: pick(religious, 'religion'),
    sect: pick(religious, 'sect'),
    caste: pick(religious, 'caste'),
    subCaste: pick(religious, 'subCaste'),
    gothram: pick(religious, 'gothram'),
    manglik: pick(religious, 'manglik'),
    canConsiderOtherReligion: pick(religious, 'canConsiderOtherReligion'),
    canConsiderOtherCaste: pick(religious, 'canConsiderOtherCaste'),
    // Professional
    highestEducation: pick(professional, 'highestEducation'),
    educationDetail: pick(professional, 'educationDetail'),
    employmentType: pick(professional, 'employmentType'),
    profession: pick(professional, 'profession'),
    companyName: pick(professional, 'companyName'),
    annualIncome: pick(professional, 'annualIncome'),
    workLocation: pick(professional, 'workLocation'),
    // Location
    currentCity: pick(location, 'currentCity'),
    currentState: pick(location, 'currentState'),
    currentCountry: pick(location, 'currentCountry'),
    nativeCity: pick(location, 'nativeCity'),
    nativeState: pick(location, 'nativeState'),
    nativeCountry: pick(location, 'nativeCountry'),
    citizenshipCountry: pick(location, 'citizenshipCountry'),
    residencyStatus: pick(location, 'residencyStatus'),
    // Physical
    heightCm: pick(physical, 'heightCm'),
    weightKg: pick(physical, 'weightKg'),
    bloodGroup: pick(physical, 'bloodGroup'),
    complexion: pick(physical, 'complexion'),
    bodyType: pick(physical, 'bodyType'),
    physicalStatus: pick(physical, 'physicalStatus'),
    // Family
    fatherStatus: pick(family, 'fatherStatus'),
    fatherProfession: pick(family, 'fatherProfession'),
    motherStatus: pick(family, 'motherStatus'),
    motherProfession: pick(family, 'motherProfession'),
    noOfBrothers: pick(family, 'noOfBrothers'),
    brothersMarried: pick(family, 'brothersMarried'),
    noOfSisters: pick(family, 'noOfSisters'),
    sistersMarried: pick(family, 'sistersMarried'),
    familyType: pick(family, 'familyType'),
    familyStatus: pick(family, 'familyStatus'),
    assetDetails: pick(family, 'assetDetails'),
    nativePlace: pick(family, 'nativePlace'),
    // Horoscope
    raasi: pick(horoscope, 'raasi'),
    nakshatra: pick(horoscope, 'nakshatra'),
    dhosam: pick(horoscope, 'dhosam'),
    lagnam: pick(horoscope, 'lagnam'),
    birthTime: pick(horoscope, 'birthTime'),
    birthCity: pick(horoscope, 'birthCity'),
    horoscopeAvailable: pick(horoscope, 'horoscopeAvailable'),
    willingToShareHoroscope: pick(horoscope, 'willingToShareHoroscope'),
  } as unknown as import('@matrimony/shared-core').UserProfile
}
