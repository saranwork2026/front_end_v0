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
  // NOTE: eyebrow/title/body/note/helper and each timeline.label / action.label
  // hold i18n KEYS (e.g. 'page.statusPage.draftTitle'), not literal text. The
  // status-view component resolves them via t(). Keep them as keys.
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
    label: 'page.statusPage.tlSubmitted',
    state: 'done',
  },
  {
    label: 'page.statusPage.tlReview',
    state:
      current === 'submitted'
        ? 'upcoming'
        : current === 'review'
          ? 'current'
          : 'done',
  },
  {
    label: 'page.statusPage.tlDecision',
    state: current === 'decision' ? 'current' : 'upcoming',
  },
]

export const statusConfig: Record<ProfileStatus, StatusConfig> = {
  DRAFT: {
    status: 'DRAFT',
    icon: 'edit',
    tone: 'primary',
    eyebrow: 'page.statusPage.draftEyebrow',
    title: 'page.statusPage.draftTitle',
    body: 'page.statusPage.draftBody',
    timeline: reviewTimeline('submitted'),
    actions: [
      { label: 'page.statusPage.draftContinue', href: '/profile/wizard', variant: 'primary' },
      { label: 'page.statusPage.draftView', href: '/profile', variant: 'secondary' },
    ],
    helper: 'page.statusPage.draftHelper',
  },
  // COMPLETED is the status a profile has AFTER it has been submitted for
  // review (submitProfile: DRAFT -> COMPLETED). So there is no "Submit for
  // review" action here — the profile is already in the review queue awaiting
  // admin approval. It mirrors the UNDER_REVIEW messaging.
  COMPLETED: {
    status: 'COMPLETED',
    icon: 'clock',
    tone: 'warning',
    eyebrow: 'page.statusPage.completedEyebrow',
    title: 'page.statusPage.completedTitle',
    body: 'page.statusPage.completedBody',
    timeline: reviewTimeline('review'),
    actions: [
      { label: 'page.statusPage.completedEdit', href: '/profile/wizard', variant: 'secondary' },
      { label: 'page.statusPage.completedPlans', href: '/plans', variant: 'ghost' },
    ],
    helper: 'page.statusPage.completedHelper',
  },
  UNDER_REVIEW: {
    status: 'UNDER_REVIEW',
    icon: 'clock',
    tone: 'warning',
    eyebrow: 'page.statusPage.reviewEyebrow',
    title: 'page.statusPage.reviewTitle',
    body: 'page.statusPage.reviewBody',
    timeline: reviewTimeline('review'),
    actions: [
      { label: 'page.statusPage.reviewEdit', href: '/profile/wizard', variant: 'secondary' },
      { label: 'page.statusPage.reviewPlans', href: '/plans', variant: 'ghost' },
    ],
    helper: 'page.statusPage.reviewHelper',
  },
  REJECTED: {
    status: 'REJECTED',
    icon: 'alert-circle',
    tone: 'danger',
    eyebrow: 'page.statusPage.rejectedEyebrow',
    title: 'page.statusPage.rejectedTitle',
    body: 'page.statusPage.rejectedBody',
    note: 'page.statusPage.rejectedNote',
    actions: [
      { label: 'page.statusPage.rejectedEdit', href: '/profile/wizard', variant: 'primary' },
      { label: 'page.statusPage.rejectedSupport', href: '/support', variant: 'ghost' },
    ],
    helper: 'page.statusPage.rejectedHelper',
  },
  APPROVED: {
    status: 'APPROVED',
    icon: 'heart',
    tone: 'primary',
    eyebrow: 'page.statusPage.approvedEyebrow',
    title: 'page.statusPage.approvedTitle',
    body: 'page.statusPage.approvedBody',
    actions: [
      { label: 'page.statusPage.approvedDashboard', href: '/', variant: 'primary' },
      { label: 'page.statusPage.approvedMatches', href: '/matches', variant: 'secondary' },
    ],
  },
}

export function resolveStatus(raw?: string): ProfileStatus {
  const upper = (raw ?? '').toUpperCase()
  if (upper in statusConfig) return upper as ProfileStatus
  return 'UNDER_REVIEW'
}
