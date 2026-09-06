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
