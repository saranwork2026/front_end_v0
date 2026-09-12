import type { IconName } from '@/components/ui/icon'

export type ProfileStatus =
  | 'DRAFT'
  | 'COMPLETED'
  | 'UNDER_REVIEW'
  | 'REJECTED'
  | 'APPROVED'

interface StatusAction {
  label: string
  href: string
  variant: 'primary' | 'secondary' | 'ghost'
}

export interface StatusConfig {
  status: ProfileStatus
  icon: IconName
  /** Tailwind token class for the icon medallion tint. */
  tone: 'warning' | 'danger' | 'success' | 'primary'
  eyebrow: string
  title: string
  body: string
  /** Ordered checklist shown under the message; the active stage is highlighted. */
  timeline?: { label: string; state: 'done' | 'current' | 'upcoming' }[]
  /** Optional reviewer note, only meaningful for REJECTED. */
  note?: string
  actions: StatusAction[]
  /** Secondary helper line beneath the actions. */
  helper?: string
}

const reviewTimeline = (
  current: 'submitted' | 'review' | 'decision',
): NonNullable<StatusConfig['timeline']> => [
  {
    label: 'Profile submitted',
    state: 'done',
  },
  {
    label: 'Under review by our team',
    state:
      current === 'submitted'
        ? 'upcoming'
        : current === 'review'
          ? 'current'
          : 'done',
  },
  {
    label: 'Decision & go live',
    state: current === 'decision' ? 'current' : 'upcoming',
  },
]

export const statusConfig: Record<ProfileStatus, StatusConfig> = {
  DRAFT: {
    status: 'DRAFT',
    icon: 'edit',
    tone: 'primary',
    eyebrow: 'Keep going',
    title: 'Your profile is still a draft',
    body: "Finish filling in your profile and reach at least 70% completion to submit it for review. It only takes a few minutes.",
    timeline: reviewTimeline('submitted'),
    actions: [
      { label: 'Continue my profile', href: '/profile/wizard', variant: 'primary' },
      { label: 'View my profile', href: '/profile', variant: 'secondary' },
    ],
    helper: 'Profiles become visible to matches only after admin approval.',
  },
  // COMPLETED is the status a profile has AFTER it has been submitted for
  // review (submitProfile: DRAFT -> COMPLETED). So there is no "Submit for
  // review" action here — the profile is already in the review queue awaiting
  // admin approval. It mirrors the UNDER_REVIEW messaging.
  COMPLETED: {
    status: 'COMPLETED',
    icon: 'clock',
    tone: 'warning',
    eyebrow: 'In progress',
    title: 'Your profile is submitted for review',
    body: "Thanks for completing your profile. Our team is verifying your details and will approve it before it goes live to matches. You'll get a notification as soon as it's approved — no action needed right now.",
    timeline: reviewTimeline('review'),
    actions: [
      { label: 'Edit my profile', href: '/profile/wizard', variant: 'secondary' },
      { label: 'Explore membership plans', href: '/plans', variant: 'ghost' },
    ],
    helper: 'Verification usually takes less than 24 hours.',
  },
  UNDER_REVIEW: {
    status: 'UNDER_REVIEW',
    icon: 'clock',
    tone: 'warning',
    eyebrow: 'In progress',
    title: 'Your profile is under review',
    body: "Our team is verifying your details to keep the community safe and genuine. You'll get a notification as soon as it's approved — no action needed from you right now.",
    timeline: reviewTimeline('review'),
    actions: [
      { label: 'Edit my profile', href: '/profile/wizard', variant: 'secondary' },
      { label: 'Explore membership plans', href: '/plans', variant: 'ghost' },
    ],
    helper: 'Most profiles are reviewed within 24 hours.',
  },
  REJECTED: {
    status: 'REJECTED',
    icon: 'alert-circle',
    tone: 'danger',
    eyebrow: 'Action needed',
    title: 'Your profile needs a few changes',
    body: 'We could not approve your profile in its current form. Please review the note below, update the flagged details, and resubmit for verification.',
    note: 'One or more photos did not clearly show your face, and the profession details need to be more specific. Please update these and resubmit.',
    actions: [
      { label: 'Edit & resubmit', href: '/profile/wizard', variant: 'primary' },
      { label: 'Contact support', href: '/support', variant: 'ghost' },
    ],
    helper: 'Once resubmitted, your profile returns to review.',
  },
  APPROVED: {
    status: 'APPROVED',
    icon: 'heart',
    tone: 'primary',
    eyebrow: 'You are live',
    title: 'Your profile is approved',
    body: 'Congratulations! Your profile is now visible to matches. Start discovering people who share your values and preferences.',
    actions: [
      { label: 'Go to dashboard', href: '/', variant: 'primary' },
      { label: 'Browse matches', href: '/matches', variant: 'secondary' },
    ],
  },
}

export function resolveStatus(raw?: string): ProfileStatus {
  const upper = (raw ?? '').toUpperCase()
  if (upper in statusConfig) return upper as ProfileStatus
  return 'UNDER_REVIEW'
}
