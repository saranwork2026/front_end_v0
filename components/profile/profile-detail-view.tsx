'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useNavigate } from 'react-router-dom'
import type { ApiError } from '@matrimony/shared-core'

import { Button, buttonVariants } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Skeleton } from '@/components/ui/skeleton'
import { Toaster, type ToastItem } from '@/components/ui/toast'
import { ProfileHero } from '@/components/profile/profile-hero'
import { PhotoGallery } from '@/components/profile/photo-gallery'
import { DetailSections } from '@/components/profile/detail-sections'
import { ConnectPanel } from '@/components/profile/connect-panel'
import { ContactPanel } from '@/components/profile/contact-panel'
import { ReportBlockActions } from '@/components/profile/report-block'
import { toProfileDetail, visiblePhotoUrls, type ProfileDetail } from '@/lib/profile-detail-data'
import {
  apiClient,
  profileApi,
  photoApi,
  blockApi,
  interestsApi,
  accessApi,
  reportApi,
} from '@/src/lib/api'
import { useAuthStore } from '@/src/stores/auth'
import { useShortlist } from '@/src/hooks/useShortlist'
import { useContactUnlock } from '@/src/hooks/useContactUnlock'

type Status = 'loading' | 'error' | 'notfound' | 'ready'

interface ProfileDetailViewProps {
  profileId: string
  previewState?: 'error' | 'notfound' | undefined
}

const interestErrorMessages: Record<string, string> = {
  INTEREST_ALREADY_SENT: 'You have already sent an interest to this member.',
  INTEREST_BLOCKED: 'You cannot send an interest to this member.',
  INTEREST_LIMIT_REACHED: 'You have reached your interest limit. Upgrade your plan to send more.',
}
const accessErrorMessages: Record<string, string> = {
  REQUEST_ALREADY_EXISTS: 'You have already requested access.',
}

export function ProfileDetailView({ profileId, previewState }: ProfileDetailViewProps) {
  const navigate = useNavigate()
  const ownProfileId = useAuthStore((s) => s.profileId)

  const [status, setStatus] = useState<Status>('loading')
  const [profile, setProfile] = useState<ProfileDetail | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  // Action state
  const [blocked, setBlocked] = useState(false)
  const [interestState, setInterestState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [photoAccess, setPhotoAccess] = useState<'none' | 'requested' | 'granted'>('none')
  const [horoscopeRequested, setHoroscopeRequested] = useState(false)
  const [contactState, setContactState] = useState<'locked' | 'requested' | 'unlocking' | 'unlocked'>('locked')
  const [revealedContact, setRevealedContact] = useState<{ phone: string; email: string }>({ phone: '', email: '' })
  // Real contact-unlock quota from the active subscription (0 when none / on error).
  const [contactQuota, setContactQuota] = useState(0)

  const { isShortlisted, toggle: toggleShortlist } = useShortlist()
  const { unlock, loading: unlocking, contact: unlockedContact, error: unlockError } = useContactUnlock()

  // Toasts
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const pushToast = useCallback(
    (message: string, variant: ToastItem['variant'] = 'info') =>
      setToasts((prev) => [...prev, { id: Date.now() + Math.floor(Math.random() * 1000), message, variant }]),
    [],
  )
  const dismissToast = useCallback((id: number) => setToasts((prev) => prev.filter((t) => t.id !== id)), [])

  const isOwnProfile = ownProfileId === profileId

  // Load profile + photos + block status.
  useEffect(() => {
    if (previewState === 'error') return setStatus('error')
    if (previewState === 'notfound') return setStatus('notfound')

    let active = true
    setStatus('loading')
    setProfile(null)

    async function load() {
      try {
        const [profileRes, photosRes, horoscopeRes, blockedRes] = await Promise.allSettled([
          profileApi.getProfileById(profileId),
          photoApi.getPhotosForProfile(profileId),
          photoApi.getHoroscopePhotosForProfile(profileId),
          blockApi.getBlockedUsers(),
        ])

        if (!active) return

        if (profileRes.status === 'rejected') {
          const status = (profileRes.reason as { response?: { status?: number } })?.response?.status
          return setStatus(status === 404 ? 'notfound' : 'error')
        }

        const photos = photosRes.status === 'fulfilled' ? photosRes.value.data : []
        const photoUrls = visiblePhotoUrls(photos)
        const anyBlurred = photos.some((p) => p.isBlurred)
        const horoscopeCount = horoscopeRes.status === 'fulfilled' ? horoscopeRes.value.data.length : 0

        const detail = toProfileDetail(profileRes.value.data, {
          photoUrls,
          photosLocked: photoUrls.length === 0 && anyBlurred,
          horoscopePhotoCount: horoscopeCount,
        })
        setProfile(detail)
        setPhotoAccess(detail.photosLocked ? 'none' : 'granted')

        if (blockedRes.status === 'fulfilled') {
          setBlocked(blockedRes.value.data.some((b) => b.profileId === profileId))
        }
        setStatus('ready')
      } catch {
        if (active) setStatus('error')
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [profileId, previewState, reloadKey])

  // Reflect a successful contact unlock into the panel.
  useEffect(() => {
    if (unlockedContact) {
      setRevealedContact({ phone: unlockedContact.mobileNo ?? '', email: unlockedContact.email ?? '' })
      setContactState('unlocked')
      pushToast('Contact unlocked.', 'success')
    }
  }, [unlockedContact, pushToast])

  useEffect(() => {
    if (unlockError) pushToast(unlockError, 'error')
  }, [unlockError, pushToast])

  // Fetch the viewer's active-subscription contact quota so the contact panel
  // shows the real number of free unlocks left (0 when there's no active plan).
  useEffect(() => {
    if (isOwnProfile) return
    let active = true
    apiClient
      .get<{ remainingContactViews?: number }>('/user/subscriptions/active')
      .then((res) => {
        if (active) setContactQuota(res.data?.remainingContactViews ?? 0)
      })
      .catch(() => {
        // No active subscription (SUBSCRIPTION_NOT_FOUND) or error → 0 free unlocks.
        if (active) setContactQuota(0)
      })
    return () => {
      active = false
    }
  }, [isOwnProfile, reloadKey])

  /* ----------------------------- handlers ----------------------------- */
  const handleSendInterest = async () => {
    if (interestState !== 'idle') return
    setInterestState('sending')
    try {
      await interestsApi.sendInterest(profileId)
      setInterestState('sent')
      pushToast('Interest sent. We will notify you when it is accepted.', 'success')
    } catch (err: unknown) {
      const code = (err as { response?: { data?: ApiError } })?.response?.data?.errorCode
      if (code === 'INTEREST_ALREADY_SENT') setInterestState('sent')
      else setInterestState('idle')
      pushToast(code ? interestErrorMessages[code] ?? 'Could not send interest.' : 'Could not send interest.', 'error')
    }
  }

  const handleShortlistToggle = () => void toggleShortlist(profileId)

  const handleShare = () => {
    if (!profile) return
    const name = [profile.firstName, profile.lastName].filter(Boolean).join(' ')
    const text = `Check out this profile on Magizh Matrimony: ${name} (${profile.profileId})`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')
  }

  const requestAccess = async (type: 'PHOTO' | 'CONTACT') => {
    try {
      await accessApi.sendAccessRequest(profileId, type)
      if (type === 'PHOTO') setPhotoAccess('requested')
      else setContactState('requested')
      pushToast(`${type === 'PHOTO' ? 'Photo' : 'Contact'} access request sent.`, 'success')
    } catch (err: unknown) {
      const code = (err as { response?: { data?: ApiError } })?.response?.data?.errorCode
      pushToast(code ? accessErrorMessages[code] ?? 'Could not send request.' : 'Could not send request.', 'error')
    }
  }

  const handleRequestPhotoAccess = () => void requestAccess('PHOTO')
  const handleRequestContactAccess = () => void requestAccess('CONTACT')
  const handleRequestHoroscope = () => {
    setHoroscopeRequested(true)
    void requestAccess('PHOTO')
  }

  const handleUnlockContact = () => {
    if (contactState === 'unlocked') {
      pushToast('Contact is already unlocked.', 'info')
      return
    }
    setContactState('unlocking')
    void unlock(profileId).finally(() => {
      // If unlock didn't resolve to unlocked (e.g. redirect to payment or
      // error), fall back to locked so the button is usable again.
      setContactState((s) => (s === 'unlocking' ? 'locked' : s))
    })
  }

  const handleReport = async (reason: string, description?: string) => {
    try {
      await reportApi.reportUser(profileId, {
        reason: reason as never,
        ...(description ? { description } : {}),
      })
      pushToast('Report submitted. Thank you for keeping the community safe.', 'success')
    } catch (err: unknown) {
      const httpStatus = (err as { response?: { status?: number } })?.response?.status
      if (httpStatus === 409) {
        pushToast('You have already reported this member.', 'info')
      } else {
        pushToast('Could not submit the report. Please try again.', 'error')
      }
    }
  }

  const handleBlock = async () => {
    try {
      await blockApi.blockUser(profileId)
      setBlocked(true)
      pushToast('Profile blocked.', 'success')
    } catch {
      pushToast('Could not block this member. Please try again.', 'error')
    }
  }

  const handleUnblock = async () => {
    try {
      await blockApi.unblockUser(profileId)
      setBlocked(false)
      pushToast('Profile unblocked.', 'success')
    } catch {
      pushToast('Could not unblock this member. Please try again.', 'error')
    }
  }

  /* ----------------------------- render ----------------------------- */
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-36 pt-5 sm:px-6 lg:pb-12">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <Icon name="chevron-left" size={18} />
        Back to results
      </button>

      {status === 'loading' && <LoadingState />}
      {status === 'error' && <ErrorState onRetry={() => setReloadKey((k) => k + 1)} />}
      {status === 'notfound' && <NotFoundState />}

      {status === 'ready' && profile && (
        <ReadyContent
          profile={{ ...profile, contact: revealedContact }}
          blocked={blocked}
          isOwnProfile={isOwnProfile}
          showActions={!blocked && !isOwnProfile}
          shortlisted={isShortlisted(profileId)}
          interestState={interestState}
          photoAccess={photoAccess}
          horoscopeRequested={horoscopeRequested}
          contactState={unlocking ? 'unlocking' : contactState}
          contactQuota={contactQuota}
          onSendInterest={() => void handleSendInterest()}
          onShortlistToggle={handleShortlistToggle}
          onShare={handleShare}
          onRequestPhotoAccess={handleRequestPhotoAccess}
          onRequestHoroscope={handleRequestHoroscope}
          onUnlock={handleUnlockContact}
          onRequestContactAccess={handleRequestContactAccess}
          onReport={(r, d) => void handleReport(r, d)}
          onBlock={() => void handleBlock()}
          onUnblock={() => void handleUnblock()}
        />
      )}

      <Toaster toasts={toasts} onDismiss={dismissToast} />
    </main>
  )
}

/* ----------------------------- states ----------------------------- */

function LoadingState() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-40 w-full rounded-2xl" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Skeleton className="aspect-[16/10] w-full rounded-2xl" />
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-44 w-full rounded-2xl" />
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <Skeleton className="h-52 w-full rounded-2xl" />
          <Skeleton className="h-52 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="mx-auto max-w-md rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
      <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <Icon name="alert-circle" size={28} />
      </span>
      <h1 className="mt-4 font-serif text-xl font-bold text-foreground">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted-foreground text-pretty">
        We couldn&apos;t load this profile. Please check your connection and try again.
      </p>
      <Button variant="primary" className="mt-5" onClick={onRetry}>
        <Icon name="refresh" size={16} />
        Try again
      </Button>
    </div>
  )
}

function NotFoundState() {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
      <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-secondary text-primary">
        <Icon name="eye" size={28} />
      </span>
      <h1 className="mt-4 font-serif text-xl font-bold text-foreground">Profile unavailable</h1>
      <p className="mt-2 text-sm text-muted-foreground text-pretty">
        This profile may have been removed, set to private, or is no longer active.
      </p>
      <Link href="/search" className={buttonVariants({ variant: 'secondary', className: 'mt-5' })}>
        <Icon name="search" size={16} />
        Browse other profiles
      </Link>
    </div>
  )
}

/* ----------------------------- ready ----------------------------- */

interface ReadyContentProps {
  profile: ProfileDetail
  blocked: boolean
  isOwnProfile: boolean
  showActions: boolean
  shortlisted: boolean
  interestState: 'idle' | 'sending' | 'sent'
  photoAccess: 'none' | 'requested' | 'granted'
  horoscopeRequested: boolean
  contactState: 'locked' | 'requested' | 'unlocking' | 'unlocked'
  contactQuota: number
  onSendInterest: () => void
  onShortlistToggle: () => void
  onShare: () => void
  onRequestPhotoAccess: () => void
  onRequestHoroscope: () => void
  onUnlock: () => void
  onRequestContactAccess: () => void
  onReport: (reason: string, description?: string) => void
  onBlock: () => void
  onUnblock: () => void
}

function ReadyContent({
  profile,
  blocked,
  isOwnProfile,
  showActions,
  shortlisted,
  interestState,
  photoAccess,
  horoscopeRequested,
  contactState,
  contactQuota,
  onSendInterest,
  onShortlistToggle,
  onShare,
  onRequestPhotoAccess,
  onRequestHoroscope,
  onUnlock,
  onRequestContactAccess,
  onReport,
  onBlock,
  onUnblock,
}: ReadyContentProps) {
  const name = [profile.firstName, profile.lastName].filter(Boolean).join(' ')
  const photosVisible = !profile.photosLocked || photoAccess === 'granted'
  // Safety actions (report/block/unblock) are available on anyone else's
  // profile, including a blocked member (so it can be unblocked).
  const safetyActionsVisible = !isOwnProfile

  return (
    <div className="space-y-6">
      <ProfileHero profile={profile} photoVisible={photosVisible} />

      {blocked && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-secondary/60 px-4 py-3 text-sm text-muted-foreground">
          <Icon name="lock" size={18} className="shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1">
            You have blocked this member. Connect actions are hidden.
          </span>
          <Button variant="secondary" size="sm" onClick={onUnblock}>
            <Icon name="check" size={16} />
            Unblock
          </Button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <PhotoGallery
            name={name}
            photos={profile.photos}
            locked={profile.photosLocked}
            accessState={photoAccess}
            onRequestAccess={onRequestPhotoAccess}
          />

          {profile.aboutMe && (
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h2 className="flex items-center gap-2 font-serif text-lg font-bold text-foreground">
                <span className="text-primary">
                  <Icon name="chat" size={18} />
                </span>
                About {profile.firstName}
              </h2>
              <p className="mt-3 leading-relaxed text-foreground/90 text-pretty">{profile.aboutMe}</p>
            </section>
          )}

          <DetailSections
            profile={profile}
            horoscopeVisible={photosVisible}
            onRequestHoroscope={onRequestHoroscope}
            horoscopeRequested={horoscopeRequested}
          />

          {safetyActionsVisible && (
            <ReportBlockActions
              name={name}
              blocked={blocked}
              onReport={onReport}
              onBlock={onBlock}
              onUnblock={onUnblock}
            />
          )}
        </div>

        <aside className="space-y-6">
          <div className="space-y-6 lg:sticky lg:top-24">
            {showActions && (
              <ConnectPanel
                interestState={interestState}
                shortlisted={shortlisted}
                photosLocked={profile.photosLocked}
                photoAccessState={photoAccess}
                onSendInterest={onSendInterest}
                onShortlistToggle={onShortlistToggle}
                onShare={onShare}
                onRequestPhotoAccess={onRequestPhotoAccess}
              />
            )}
            {showActions && (
              <ContactPanel
                state={contactState}
                contact={profile.contact}
                quotaRemaining={contactQuota}
                onUnlock={onUnlock}
                onRequestAccess={onRequestContactAccess}
              />
            )}
          </div>
        </aside>
      </div>

      {showActions && (
        <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-40 border-t border-border bg-card px-4 py-3 shadow-[0_-2px_12px_rgba(0,0,0,0.10)] lg:hidden">
          <div className="mx-auto flex max-w-6xl items-center gap-2.5">
            <Button
              variant="secondary"
              size="md"
              onClick={onShortlistToggle}
              aria-pressed={shortlisted}
              aria-label={shortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
              className="shrink-0"
            >
              <Icon name={shortlisted ? 'star-filled' : 'star'} size={18} />
            </Button>
            <Button
              variant="heart"
              size="md"
              className="flex-1"
              onClick={onSendInterest}
              loading={interestState === 'sending'}
              disabled={interestState === 'sent'}
            >
              <Icon name={interestState === 'sent' ? 'check' : 'heart-filled'} size={18} />
              {interestState === 'sent' ? 'Interest sent' : 'Send interest'}
            </Button>
            <Button variant="secondary" size="md" onClick={onShare} aria-label="Share profile" className="shrink-0">
              <Icon name="share" size={18} />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
