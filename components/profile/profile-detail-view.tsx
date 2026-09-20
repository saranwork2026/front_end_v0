'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Link from 'next/link'
import { useNavigate } from 'react-router-dom'
import type { ApiError } from '@matrimony/shared-core'

import { Button, buttonVariants } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Skeleton } from '@/components/ui/skeleton'
import { Toaster, type ToastItem } from '@/components/ui/toast'
import { ProfileHero } from '@/components/profile/profile-hero'
import { PhotoGallery, type PhotoEmptyState } from '@/components/profile/photo-gallery'
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
  contactsApi,
} from '@/src/lib/api'
import { useAuthStore } from '@/src/stores/auth'
import { useShortlist } from '@/src/hooks/useShortlist'
import { useContactUnlock } from '@/src/hooks/useContactUnlock'

type Status = 'loading' | 'error' | 'notfound' | 'ready'

interface ProfileDetailViewProps {
  profileId: string
  previewState?: 'error' | 'notfound' | undefined
}

const interestErrorKeys: Record<string, string> = {
  INTEREST_ALREADY_SENT: 'page.profile.errInterestAlreadySent',
  INTEREST_BLOCKED: 'page.profile.errInterestBlocked',
  INTEREST_LIMIT_REACHED: 'page.profile.errInterestLimit',
}
const accessErrorKeys: Record<string, string> = {
  REQUEST_ALREADY_EXISTS: 'page.profile.errRequestExists',
}

export function ProfileDetailView({ profileId, previewState }: ProfileDetailViewProps) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const ownProfileId = useAuthStore((s) => s.profileId)

  const [status, setStatus] = useState<Status>('loading')
  const [profile, setProfile] = useState<ProfileDetail | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  // Action state
  const [blocked, setBlocked] = useState(false)
  const [interestState, setInterestState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [photoAccess, setPhotoAccess] = useState<'none' | 'requested' | 'granted'>('none')
  // For the owner viewing their own profile: 'rejected' when a photo was
  // rejected, 'pending' when awaiting approval, 'none' when no photo exists at
  // all. Drives the empty-gallery message (viewers always see "no photo yet").
  const [ownPhotoEmpty, setOwnPhotoEmpty] = useState<'rejected' | 'pending' | 'none'>('none')
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
    // Reset per-profile state so stale values don't carry across navigations.
    setInterestState('idle')
    setOwnPhotoEmpty('none')

    async function load() {
      try {
        const [profileRes, photosRes, horoscopeRes, blockedRes, sentInterestsRes] = await Promise.allSettled([
          profileApi.getProfileById(profileId),
          photoApi.getPhotosForProfile(profileId),
          photoApi.getHoroscopePhotosForProfile(profileId),
          blockApi.getBlockedUsers(),
          interestsApi.getSentInterests({ status: 'PENDING', size: 100 }),
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

        // Hero avatar uses the member-set DP focal point (primary photo, else
        // the first visible one) so the same face-centered crop shows here too.
        const dpPhoto = photos.find((p) => p.isPrimary && !p.isBlurred) ?? photos.find((p) => !p.isBlurred)
        const avatarPosition = dpPhoto ? `${dpPhoto.focalX ?? 50}% ${dpPhoto.focalY ?? 50}%` : undefined

        const detail = toProfileDetail(profileRes.value.data, {
          photoUrls,
          avatarPosition,
          photosLocked: photoUrls.length === 0 && anyBlurred,
          horoscopePhotoCount: horoscopeCount,
        })
        setProfile(detail)
        setPhotoAccess(detail.photosLocked ? 'none' : 'granted')

        if (blockedRes.status === 'fulfilled') {
          setBlocked(blockedRes.value.data.some((b) => b.profileId === profileId))
        }

        // Reflect an already-sent interest so the Connect button shows
        // "Interest sent" on load (interest state isn't on the profile DTO).
        if (
          sentInterestsRes.status === 'fulfilled' &&
          sentInterestsRes.value.data.content.some((i) => i.otherProfileId === profileId)
        ) {
          setInterestState('sent')
        }

        // Owner viewing their own profile: the viewer endpoint only returns
        // APPROVED photos, so an empty list is ambiguous (no photo vs pending
        // approval). Fetch the owner's real photo list to tell them apart and
        // show an actionable message.
        if (ownProfileId === profileId && photoUrls.length === 0) {
          try {
            // listPhotos() returns the owner's own PROFILE photos (all
            // statuses). We reach here only when there's no APPROVED photo, so
            // classify what the owner does have: a REJECTED photo (actionable,
            // re-upload) takes priority, else PENDING approval, else nothing.
            const own = await photoApi.listPhotos()
            const live = own.data.filter((p) => !p.isDeleted)
            if (live.some((p) => p.status === 'REJECTED')) {
              setOwnPhotoEmpty('rejected')
            } else if (live.length > 0) {
              setOwnPhotoEmpty('pending')
            } else {
              setOwnPhotoEmpty('none')
            }
          } catch {
            setOwnPhotoEmpty('none')
          }
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
      pushToast(t('page.profile.contactUnlocked'), 'success')
    }
  }, [unlockedContact, pushToast, t])

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

  // Reveal an ALREADY-unlocked contact on load. A previously unlocked contact
  // must show immediately on revisiting the profile (not require clicking
  // "Unlock" again). Look this profile up in the viewer's unlocked-contacts
  // list (idempotent GET, never charges) and, if present, show it unlocked.
  useEffect(() => {
    if (isOwnProfile) return
    let active = true
    contactsApi
      .getUnlockedContacts()
      .then((res) => {
        if (!active) return
        const match = (res.data ?? []).find((u) => u.targetProfileId === profileId)
        if (match) {
          setRevealedContact({ phone: match.targetMobileNo ?? '', email: match.targetEmail ?? '' })
          setContactState('unlocked')
        }
      })
      .catch(() => {
        /* non-fatal: fall back to the locked state + unlock CTA */
      })
    return () => {
      active = false
    }
  }, [isOwnProfile, profileId, reloadKey])

  /* ----------------------------- handlers ----------------------------- */
  const handleSendInterest = async () => {
    if (interestState !== 'idle') return
    setInterestState('sending')
    try {
      await interestsApi.sendInterest(profileId)
      setInterestState('sent')
      pushToast(t('page.profile.interestSentToast'), 'success')
    } catch (err: unknown) {
      const code = (err as { response?: { data?: ApiError } })?.response?.data?.errorCode
      if (code === 'INTEREST_ALREADY_SENT') setInterestState('sent')
      else setInterestState('idle')
      const key = code ? interestErrorKeys[code] : undefined
      pushToast(key ? t(key as never) : t('page.profile.couldNotSendInterest'), 'error')
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
      pushToast(type === 'PHOTO' ? t('page.profile.photoAccessSent') : t('page.profile.contactAccessSent'), 'success')
    } catch (err: unknown) {
      const code = (err as { response?: { data?: ApiError } })?.response?.data?.errorCode
      const key = code ? accessErrorKeys[code] : undefined
      pushToast(key ? t(key as never) : t('page.profile.couldNotSendRequest'), 'error')
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
      pushToast(t('page.profile.contactAlreadyUnlocked'), 'info')
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
      pushToast(t('page.profile.reportSubmitted'), 'success')
    } catch (err: unknown) {
      const httpStatus = (err as { response?: { status?: number } })?.response?.status
      if (httpStatus === 409) {
        pushToast(t('page.profile.alreadyReported'), 'info')
      } else {
        pushToast(t('page.profile.couldNotReport'), 'error')
      }
    }
  }

  const handleBlock = async () => {
    try {
      await blockApi.blockUser(profileId)
      setBlocked(true)
      pushToast(t('page.profile.profileBlocked'), 'success')
    } catch {
      pushToast(t('page.profile.couldNotBlock'), 'error')
    }
  }

  const handleUnblock = async () => {
    try {
      await blockApi.unblockUser(profileId)
      setBlocked(false)
      pushToast(t('page.profile.profileUnblocked'), 'success')
    } catch {
      pushToast(t('page.profile.couldNotUnblock'), 'error')
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
        {t('page.profile.backToResults')}
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
          photoEmptyState={
            isOwnProfile
              ? ownPhotoEmpty === 'rejected'
                ? 'owner-rejected'
                : ownPhotoEmpty === 'pending'
                  ? 'owner-pending'
                  : 'owner-none'
              : 'viewer-none'
          }
          horoscopeRequested={horoscopeRequested}
          contactState={unlocking ? 'unlocking' : contactState}
          contactQuota={contactQuota}
          onSendInterest={() => void handleSendInterest()}
          onMessage={() => navigate(`/chat/${profileId}`)}
          onShortlistToggle={handleShortlistToggle}
          onShare={handleShare}
          onRequestPhotoAccess={handleRequestPhotoAccess}
          onManagePhotos={() => navigate('/photos')}
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
  const { t } = useTranslation()
  return (
    <div role="alert" className="mx-auto max-w-md rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
      <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <Icon name="alert-circle" size={28} />
      </span>
      <h1 className="mt-4 font-serif text-xl font-bold text-foreground">{t('page.profile.errorTitle')}</h1>
      <p className="mt-2 text-sm text-muted-foreground text-pretty">
        {t('page.profile.errorDesc')}
      </p>
      <Button variant="primary" className="mt-5" onClick={onRetry}>
        <Icon name="refresh" size={16} />
        {t('page.profile.tryAgain')}
      </Button>
    </div>
  )
}

function NotFoundState() {
  const { t } = useTranslation()
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
      <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-secondary text-primary">
        <Icon name="eye" size={28} />
      </span>
      <h1 className="mt-4 font-serif text-xl font-bold text-foreground">{t('page.profile.notFoundTitle')}</h1>
      <p className="mt-2 text-sm text-muted-foreground text-pretty">
        {t('page.profile.notFoundDesc')}
      </p>
      <Link href="/search" className={buttonVariants({ variant: 'secondary', className: 'mt-5' })}>
        <Icon name="search" size={16} />
        {t('page.profile.browseOthers')}
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
  photoEmptyState: PhotoEmptyState
  horoscopeRequested: boolean
  contactState: 'locked' | 'requested' | 'unlocking' | 'unlocked'
  contactQuota: number
  onSendInterest: () => void
  onShortlistToggle: () => void
  onShare: () => void
  onRequestPhotoAccess: () => void
  onManagePhotos: () => void
  onRequestHoroscope: () => void
  onUnlock: () => void
  onRequestContactAccess: () => void
  onReport: (reason: string, description?: string) => void
  onBlock: () => void
  onUnblock: () => void
  onMessage: () => void
}

function ReadyContent({
  profile,
  blocked,
  isOwnProfile,
  showActions,
  shortlisted,
  interestState,
  photoAccess,
  photoEmptyState,
  horoscopeRequested,
  contactState,
  contactQuota,
  onSendInterest,
  onShortlistToggle,
  onShare,
  onRequestPhotoAccess,
  onManagePhotos,
  onRequestHoroscope,
  onUnlock,
  onRequestContactAccess,
  onReport,
  onBlock,
  onUnblock,
  onMessage,
}: ReadyContentProps) {
  const { t } = useTranslation()
  const name = [profile.firstName, profile.lastName].filter(Boolean).join(' ')
  const photosVisible = !profile.photosLocked || photoAccess === 'granted'
  // Safety actions (report/block/unblock) are available on anyone else's
  // profile, including a blocked member (so it can be unblocked).
  const safetyActionsVisible = !isOwnProfile

  return (
    <div className="space-y-6">
      <ProfileHero profile={profile} photoVisible={photosVisible} />

      {/* Prominent alert when the owner's photo was rejected — shown up top so
          they don't miss it (also mirrored inside the photo box below). */}
      {isOwnProfile && photoEmptyState === 'owner-rejected' && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
          <Icon name="alert-circle" size={18} className="shrink-0 text-destructive" />
          <span className="min-w-0 flex-1 text-foreground">
            {t('page.profile.photoRejectedAlert')}
          </span>
          <Button variant="secondary" size="sm" onClick={onManagePhotos}>
            <Icon name="camera" size={16} />
            {t('page.profile.reUploadPhoto')}
          </Button>
        </div>
      )}

      {blocked && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-secondary/60 px-4 py-3 text-sm text-muted-foreground">
          <Icon name="lock" size={18} className="shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1">
            {t('page.profile.blockedBanner')}
          </span>
          <Button variant="secondary" size="sm" onClick={onUnblock}>
            <Icon name="check" size={16} />
            {t('page.profile.unblock')}
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
            emptyState={photoEmptyState}
            onManagePhotos={onManagePhotos}
          />

          {profile.aboutMe && (
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h2 className="flex items-center gap-2 font-serif text-lg font-bold text-foreground">
                <span className="text-primary">
                  <Icon name="chat" size={18} />
                </span>
                {t('page.profile.about', { name: profile.firstName })}
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
            {/* Desktop-only: on mobile the fixed bottom action bar provides
                Send interest / Shortlist / Share, so hide this card there to
                avoid a duplicate "Send interest" button. */}
            {showActions && (
              <div className="hidden lg:block">
                <ConnectPanel
                  interestState={interestState}
                  shortlisted={shortlisted}
                  photosLocked={profile.photosLocked}
                  photoAccessState={photoAccess}
                  onSendInterest={onSendInterest}
                  onShortlistToggle={onShortlistToggle}
                  onShare={onShare}
                  onRequestPhotoAccess={onRequestPhotoAccess}
                  onMessage={onMessage}
                />
              </div>
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
              aria-label={shortlisted ? t('page.profile.removeFromShortlist') : t('page.profile.addToShortlist')}
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
              {interestState === 'sent' ? t('page.profile.interestSent') : t('page.profile.sendInterest')}
            </Button>
            <Button variant="secondary" size="md" onClick={onShare} aria-label={t('page.profile.shareProfile')} className="shrink-0">
              <Icon name="share" size={18} />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
