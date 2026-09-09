'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { PhotoResponse, PhotoVisibility } from '@matrimony/shared-core'

import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/ui/status-badge'
import { Toaster, type ToastItem } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { photoApi } from '@/src/lib/api'

const MAX_PROFILE_PHOTOS = 3
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ACCEPT_ATTR = 'image/jpeg,image/png,image/webp'

const VISIBILITY_OPTIONS: { value: PhotoVisibility; label: string }[] = [
  { value: 'PUBLIC', label: 'Public — visible to all members' },
  { value: 'PREMIUM_ONLY', label: 'Premium only — visible to paid members' },
  { value: 'REQUEST_REQUIRED', label: 'On request — members must ask to view' },
]

function validateFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return 'Invalid file format. Only JPEG, PNG, and WEBP are accepted.'
  }
  if (file.size > MAX_FILE_SIZE) {
    return 'File is too large. Maximum size is 5 MB.'
  }
  return null
}

/** Extracts a human message from a backend error response, with a fallback. */
function apiErrorMessage(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: { errorCode?: string; message?: string } } })?.response?.data
  if (data?.errorCode === 'INVALID_PHOTO_TYPE' || data?.errorCode === 'INVALID_FILE_TYPE') {
    return 'Invalid file format. Only JPEG, PNG, and WEBP are accepted.'
  }
  if (data?.errorCode === 'PHOTO_TOO_LARGE') {
    return 'File is too large.'
  }
  if (data?.errorCode === 'PHOTO_LIMIT_REACHED') {
    return 'You have reached the maximum number of photos.'
  }
  return data?.message || fallback
}

/**
 * Real photo manager backed by `photoApi` (multipart upload to /user/photos).
 * Shared by the standalone /photos page and the profile wizard's Photos step so
 * the two stay in sync (business rule: profile UI consistency). Photos upload
 * immediately on file selection — they are NOT part of the wizard form state.
 */
export function PhotoManager() {
  const [photos, setPhotos] = useState<PhotoResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const [uploadingProfile, setUploadingProfile] = useState(false)
  const [visibility, setVisibility] = useState<PhotoVisibility>('PUBLIC')
  const [busyPhotoId, setBusyPhotoId] = useState<number | null>(null)

  const [toasts, setToasts] = useState<ToastItem[]>([])
  const profileInputRef = useRef<HTMLInputElement>(null)

  const pushToast = useCallback((message: string, variant: ToastItem['variant']) => {
    setToasts((prev) => [...prev, { id: Date.now() + Math.random(), message, variant }])
  }, [])

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const photosRes = await photoApi.listPhotos()
      setPhotos((photosRes.data ?? []).filter((p) => !p.isDeleted))
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const profileCount = photos.length
  const canUploadProfile = profileCount < MAX_PROFILE_PHOTOS

  const handleProfileFile = useCallback(
    async (file: File | undefined) => {
      if (!file) return
      const validationError = validateFile(file)
      if (validationError) {
        pushToast(validationError, 'error')
        return
      }
      if (!canUploadProfile) {
        pushToast(`You can upload up to ${MAX_PROFILE_PHOTOS} profile photos.`, 'error')
        return
      }
      setUploadingProfile(true)
      try {
        const res = await photoApi.uploadPhoto(file, visibility)
        setPhotos((prev) => [...prev, res.data])
        pushToast('Photo uploaded. It will be visible after admin approval.', 'success')
      } catch (err) {
        pushToast(apiErrorMessage(err, 'Upload failed. Please try again.'), 'error')
      } finally {
        setUploadingProfile(false)
        if (profileInputRef.current) profileInputRef.current.value = ''
      }
    },
    [canUploadProfile, pushToast, visibility],
  )

  const handleSetPrimary = useCallback(
    async (photoId: number) => {
      setBusyPhotoId(photoId)
      try {
        await photoApi.setPrimary(photoId)
        setPhotos((prev) => prev.map((p) => ({ ...p, isPrimary: p.photoId === photoId })))
        pushToast('Primary photo updated.', 'success')
      } catch (err) {
        pushToast(apiErrorMessage(err, 'Could not set primary photo.'), 'error')
      } finally {
        setBusyPhotoId(null)
      }
    },
    [pushToast],
  )

  const handleDelete = useCallback(
    async (photoId: number) => {
      setBusyPhotoId(photoId)
      try {
        await photoApi.deletePhoto(photoId)
        setPhotos((prev) => prev.filter((p) => p.photoId !== photoId))
        pushToast('Photo deleted.', 'success')
      } catch (err) {
        pushToast(apiErrorMessage(err, 'Could not delete photo.'), 'error')
      } finally {
        setBusyPhotoId(null)
      }
    },
    [pushToast],
  )

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square w-full rounded-2xl" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div
        role="alert"
        className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 px-6 py-10 text-center"
      >
        <Icon name="alert-circle" size={28} className="text-destructive" />
        <p className="text-sm text-foreground">We couldn&apos;t load your photos. Please try again.</p>
        <Button variant="secondary" size="sm" onClick={() => void load()}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <>
      {/* Profile photos */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-serif text-lg text-foreground">
            <span className="text-primary">
              <Icon name="photo" size={18} />
            </span>
            Profile photos
          </h2>
          <span className="text-sm text-muted-foreground tabular-nums">
            {profileCount} / {MAX_PROFILE_PHOTOS}
          </span>
        </div>

        {photos.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            You haven&apos;t added any profile photos yet.
          </p>
        ) : (
          <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {photos.map((photo) => (
              <li key={photo.photoId}>
                <PhotoTile
                  photo={photo}
                  busy={busyPhotoId === photo.photoId}
                  onSetPrimary={
                    !photo.isPrimary && photo.status === 'APPROVED'
                      ? () => void handleSetPrimary(photo.photoId)
                      : undefined
                  }
                  onDelete={() => void handleDelete(photo.photoId)}
                />
              </li>
            ))}
          </ul>
        )}

        {/* Upload control */}
        <div className="mt-5 border-t border-border/70 pt-5">
          {canUploadProfile ? (
            <div className="flex flex-col gap-4">
              <div>
                <input
                  ref={profileInputRef}
                  type="file"
                  accept={ACCEPT_ATTR}
                  className="sr-only"
                  onChange={(e) => void handleProfileFile(e.target.files?.[0])}
                />
                <Button
                  variant="primary"
                  loading={uploadingProfile}
                  onClick={() => profileInputRef.current?.click()}
                >
                  <Icon name="upload" size={18} />
                  Upload photo
                </Button>
              </div>
              <fieldset className="flex flex-col gap-2" disabled={uploadingProfile}>
                <legend className="mb-1 text-sm font-medium text-foreground">
                  Who can see this photo?
                </legend>
                {VISIBILITY_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex cursor-pointer items-start gap-2.5 text-sm text-foreground"
                  >
                    <input
                      type="radio"
                      name="photo-visibility"
                      value={opt.value}
                      checked={visibility === opt.value}
                      onChange={() => setVisibility(opt.value)}
                      className="mt-0.5 size-4 shrink-0 cursor-pointer accent-primary"
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </fieldset>
            </div>
          ) : (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Icon name="alert-circle" size={16} />
              You&apos;ve reached the {MAX_PROFILE_PHOTOS}-photo limit. Delete a photo to add a new one.
            </p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            JPEG, PNG, or WEBP. Up to 5 MB.
          </p>
        </div>
      </section>

      <Toaster toasts={toasts} onDismiss={dismissToast} />
    </>
  )
}

interface PhotoTileProps {
  photo: PhotoResponse
  busy: boolean
  onSetPrimary?: () => void
  onDelete: () => void
  hidePrimary?: boolean
}

function PhotoTile({ photo, busy, onSetPrimary, onDelete, hidePrimary }: PhotoTileProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="relative aspect-square bg-muted">
        {photo.photoUrl ? (
          <img
            src={photo.thumbnailUrl ?? photo.photoUrl}
            alt="Uploaded photo"
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center px-2 text-center text-xs text-muted-foreground">
            Processing…
          </span>
        )}
        {!hidePrimary && photo.isPrimary && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-card/90 px-2 py-0.5 text-xs font-medium text-gold shadow-sm">
            <Icon name="star-filled" size={12} />
            Primary
          </span>
        )}
      </div>
      <div className="flex flex-col gap-3 p-3">
        <StatusBadge status={photo.status} />
        <div className={cn('flex flex-wrap gap-2', !onSetPrimary && 'justify-start')}>
          {onSetPrimary && (
            <Button variant="secondary" size="sm" loading={busy} onClick={onSetPrimary}>
              <Icon name="star" size={16} />
              Set primary
            </Button>
          )}
          <Button
            variant="danger"
            size="sm"
            loading={busy}
            onClick={onDelete}
            aria-label="Delete photo"
          >
            <Icon name="trash" size={16} />
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}
