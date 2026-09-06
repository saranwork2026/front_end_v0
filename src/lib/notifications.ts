import type { IconName } from '@/components/ui/icon'
import type { Notification, NotificationType } from '@matrimony/shared-core'

/** Backend NotificationType → stroke Icon (fixes the spec's emoji gap). */
const ICON: Record<NotificationType, IconName> = {
  NEW_INTEREST: 'heart',
  INTEREST_ACCEPTED: 'heart',
  INTEREST_REJECTED: 'heart',
  ACCESS_REQUEST_RECEIVED: 'lock',
  ACCESS_REQUEST_RESPONDED: 'lock',
  NEW_MESSAGE: 'chat',
  CONTACT_UNLOCKED: 'phone',
  SUBSCRIPTION_EXPIRING: 'wallet',
  PROFILE_VIEWED: 'eye',
  OTP_VERIFIED: 'shield',
  PROFILE_SUBMITTED: 'user',
  PROFILE_INCOMPLETE_REMINDER: 'user',
  PROFILE_APPROVED: 'circle-check',
  PROFILE_REJECTED: 'alert-circle',
  PHOTO_APPROVED: 'photo',
  PHOTO_REJECTED: 'photo',
  PAYMENT_APPROVED: 'wallet',
  PLAN_ACTIVATED: 'wallet',
}

type Tone = 'primary' | 'gold' | 'success' | 'neutral'
const TONE: Record<NotificationType, Tone> = {
  NEW_INTEREST: 'primary',
  INTEREST_ACCEPTED: 'success',
  INTEREST_REJECTED: 'neutral',
  ACCESS_REQUEST_RECEIVED: 'neutral',
  ACCESS_REQUEST_RESPONDED: 'neutral',
  NEW_MESSAGE: 'gold',
  CONTACT_UNLOCKED: 'success',
  SUBSCRIPTION_EXPIRING: 'gold',
  PROFILE_VIEWED: 'neutral',
  OTP_VERIFIED: 'success',
  PROFILE_SUBMITTED: 'neutral',
  PROFILE_INCOMPLETE_REMINDER: 'gold',
  PROFILE_APPROVED: 'success',
  PROFILE_REJECTED: 'neutral',
  PHOTO_APPROVED: 'success',
  PHOTO_REJECTED: 'neutral',
  PAYMENT_APPROVED: 'success',
  PLAN_ACTIVATED: 'success',
}

export function notificationIcon(type: NotificationType): IconName {
  return ICON[type] ?? 'bell'
}
export function notificationTone(type: NotificationType): Tone {
  return TONE[type] ?? 'neutral'
}

/** Derive a deep-link target from the notification type + referenceId. */
export function notificationHref(n: Notification): string | undefined {
  const ref = n.referenceId ?? undefined
  switch (n.type) {
    case 'NEW_INTEREST':
    case 'INTEREST_ACCEPTED':
    case 'INTEREST_REJECTED':
      return '/interests'
    case 'ACCESS_REQUEST_RECEIVED':
    case 'ACCESS_REQUEST_RESPONDED':
      return '/access-requests'
    case 'NEW_MESSAGE':
      return ref ? `/chat/${ref}` : '/chat'
    case 'CONTACT_UNLOCKED':
      return '/contacts'
    case 'PROFILE_VIEWED':
      return '/profile-views'
    case 'SUBSCRIPTION_EXPIRING':
    case 'PLAN_ACTIVATED':
      return '/subscriptions'
    case 'PAYMENT_APPROVED':
      return '/payments/history'
    case 'PROFILE_APPROVED':
      return '/'
    case 'PROFILE_REJECTED':
    case 'PROFILE_INCOMPLETE_REMINDER':
    case 'PROFILE_SUBMITTED':
      return '/profile'
    case 'PHOTO_APPROVED':
    case 'PHOTO_REJECTED':
      return '/photos'
    default:
      return undefined
  }
}

export function formatNotificationTime(iso: string): string {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (min < 1) return 'Just now'
  if (min < 60) return `${min}m ago`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.round(hr / 24)
  if (day < 7) return `${day}d ago`
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatNotificationFull(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
  })
}

export const toneClasses: Record<Tone, { wrap: string; icon: string }> = {
  primary: { wrap: 'bg-primary/10', icon: 'text-primary' },
  gold: { wrap: 'bg-gold-soft', icon: 'text-gold-foreground' },
  success: { wrap: 'bg-success-soft', icon: 'text-success' },
  neutral: { wrap: 'bg-muted', icon: 'text-muted-foreground' },
}
