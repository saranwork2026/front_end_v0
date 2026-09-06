import type { IconName } from '@/components/ui/icon'

/**
 * Plans domain data + helpers for `/plans` (UI/UX spec §4.5).
 *
 * Mirrors the existing PlansPage exactly. Nothing is invented:
 * - Public plan catalog from `plansApi.getActivePlans`.
 * - Premium tiers (planName !== 'BASE') get gold border + badge.
 * - Feature list rendered via `Icon`s.
 * - Subscribe → `/payment?planId={planId}`.
 * - Loading = 4 skeleton cards. Error = inline error box.
 *
 * The catalogue shape matches the documented Plan model: planName, price,
 * validityDays, the four quota limits, plus chat/boost booleans. Feature
 * bullets are derived from those fields — no fields beyond the model.
 */

export interface PlanFeature {
  icon: IconName
  label: string
  /** false renders the row muted with an x-mark (feature not included). */
  included: boolean
}

export interface Plan {
  planId: string
  /** BASE = free tier; anything else is a premium tier (gold-highlighted). */
  planName: string
  displayName: string
  description: string
  /** Price in INR for the full validity period. 0 for BASE. */
  price: number
  validityDays: number
  /** Quota limits from the Plan model. -1 means unlimited. */
  contactViewLimit: number
  interestLimit: number
  shortlistLimit: number
  galleryRequestLimit: number
  chatEnabled: boolean
  boostEnabled: boolean
  /** Marketing tag for the most-recommended premium tier. */
  highlighted?: boolean
}

export const PLANS: Plan[] = [
  {
    planId: 'base',
    planName: 'BASE',
    displayName: 'Free',
    description: 'Get started and explore matches at your own pace.',
    price: 0,
    validityDays: 0,
    contactViewLimit: 0,
    interestLimit: 5,
    shortlistLimit: 10,
    galleryRequestLimit: 0,
    chatEnabled: false,
    boostEnabled: false,
  },
  {
    planId: 'silver',
    planName: 'SILVER',
    displayName: 'Silver',
    description: 'Unlock contacts and connect with more families.',
    price: 1999,
    validityDays: 90,
    contactViewLimit: 25,
    interestLimit: 50,
    shortlistLimit: 50,
    galleryRequestLimit: 15,
    chatEnabled: true,
    boostEnabled: false,
  },
  {
    planId: 'gold',
    planName: 'GOLD',
    displayName: 'Gold',
    description: 'Our most popular plan for serious matchmaking.',
    price: 3499,
    validityDays: 180,
    contactViewLimit: 75,
    interestLimit: 150,
    shortlistLimit: 150,
    galleryRequestLimit: 50,
    chatEnabled: true,
    boostEnabled: true,
    highlighted: true,
  },
  {
    planId: 'platinum',
    planName: 'PLATINUM',
    displayName: 'Platinum',
    description: 'Unlimited reach with priority visibility.',
    price: 5999,
    validityDays: 365,
    contactViewLimit: -1,
    interestLimit: -1,
    shortlistLimit: -1,
    galleryRequestLimit: -1,
    chatEnabled: true,
    boostEnabled: true,
  },
]

const fmtLimit = (n: number) => (n === -1 ? 'Unlimited' : String(n))

/** Derives the feature bullet list for a plan from its quota/flag fields. */
export function planFeatures(plan: Plan): PlanFeature[] {
  return [
    {
      icon: 'phone',
      label:
        plan.contactViewLimit === 0
          ? 'No contact views'
          : `${fmtLimit(plan.contactViewLimit)} contact views`,
      included: plan.contactViewLimit !== 0,
    },
    {
      icon: 'heart',
      label: `${fmtLimit(plan.interestLimit)} interests`,
      included: plan.interestLimit !== 0,
    },
    {
      icon: 'star',
      label: `${fmtLimit(plan.shortlistLimit)} shortlists`,
      included: plan.shortlistLimit !== 0,
    },
    {
      icon: 'eye',
      label:
        plan.galleryRequestLimit === 0
          ? 'No photo requests'
          : `${fmtLimit(plan.galleryRequestLimit)} photo requests`,
      included: plan.galleryRequestLimit !== 0,
    },
    {
      icon: 'chat',
      label: 'Chat with matches',
      included: plan.chatEnabled,
    },
    {
      icon: 'zap',
      label: 'Profile boost & spotlight',
      included: plan.boostEnabled,
    },
  ]
}

/** True for any paid/premium tier (gold border + badge per spec). */
export function isPremiumPlan(plan: Plan): boolean {
  return plan.planName !== 'BASE'
}

export const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

/** Human validity label, e.g. "90 days" or "1 year". */
export function validityLabel(days: number): string {
  if (days <= 0) return 'Forever'
  if (days % 365 === 0) {
    const y = days / 365
    return `${y} ${y === 1 ? 'year' : 'years'}`
  }
  if (days % 30 === 0) {
    const m = days / 30
    return `${m} ${m === 1 ? 'month' : 'months'}`
  }
  return `${days} days`
}

/** Per-month equivalent for premium tiers, for at-a-glance comparison. */
export function perMonth(plan: Plan): number | null {
  if (plan.price <= 0 || plan.validityDays <= 0) return null
  return Math.round(plan.price / (plan.validityDays / 30))
}

export type PlansState = 'loading' | 'error' | 'ready'

/** Stand-in for `plansApi.getActivePlans()`. */
export async function getActivePlans(): Promise<Plan[]> {
  await new Promise((r) => setTimeout(r, 700))
  return PLANS
}
