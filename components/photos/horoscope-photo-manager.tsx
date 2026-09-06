'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { PhotoResponse } from '@matrimony/shared-core'

import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { StatusBadge } from '@/components/ui/status-badge'
import { Toaster, type ToastItem } from '@/components/ui/toast'
import { photoApi } from '@/src/lib/api'

const MAX_HOROSCOPE_PHOTOS = 2
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ACCEPT_ATTR = 'image/jpeg,image/png,image/webp'

function validateFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return 'Invalid file format. Only JPEG, PNG, and WEBP are accepted.'
  }
  if (file.size > MAX_FILE_SIZE) {
    return 'File is too large. Maximum size is 5 MB.'
  }
  return null
}

function apiErrorMessage(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: { errorCode?: string; message?: string } } })?.response
    ?.data
  if (data?.errorCode === 'INVALID_PHOTO_TYPE' || data?.errorCode === 'INVALID_FILE_TYPE') {
    return 'Invalid file format. Only JPEG, PNG, and WEBP are accepted.'
  }
  if (data?.errorCode === 'PHOTO_TOO_LARGE') return 'File is too large.'
  if (data?.errorCode === 'PHOTO_LIMIT_REACHED') return 'You have reached the horoscope-photo limit.'
  return data?.message || fallback
}

/**
 * Real horoscope-chart uploader for the profile wizard's Horoscope step.
 * Backed by photoApi (multipart POST /user/photos/horoscope) — the same
 * endpoints the standalone /photos PhotoManager uses, so the two stay in sync.
 * Horoscope photos are NOT part of the wizard form state: they upload
 * immediately on file selection, list existing charts, and allow delete.
 * Backend forces visibility to REQUEST_REQUIRED and requires admin approval.
 */
export function HoroscopePhotoManager() {
  const [photos, setPhotos] = useState<PhotoResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const pushToast = useCallback((message: string, variant: ToastItem['variant']) => {
    setToasts((prev) => [...prev, { id: Date.now() + Math.random(), message, variant }])
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await photoApi.listHoroscopePhotos()
      setPhotos((res.data ?? []).filter((p) => !p.isDeleted))
    } catch {
      // Non-fatal — the upload control still works even if the list fails.
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const canUpload = photos.length < MAX_HOROSCOPE_PHOTOS

  const handleFile = useCallback(
    async (file: File | undefined) => {
      if (!file) return
      const validationError = validateFile(file)
      if (validationError) {
        pushToast(validationError, 'error')
        return
      }
      if (!canUpload) {
        pushToast(`You can upload up to ${MAX_HOROSCOPE_PHOTOS} horoscope photos.`, 'error')
        return
      }
      setUploading(true)
      try {
        const res = await photoApi.uploadHoroscopePhoto(file)
        setPhotos((prev) => [...prev, res.data])
        pushToast('Horoscope chart uploaded. It will be visible after admin approval.', 'success')
      } catch (err) {
        pushToast(apiErrorMessage(err, 'Upload failed. Please try again.'), 'error')
      } finally {
        setUploading(false)
        if (inputRef.current) inputRef.current.value = ''
      }
    },
    [canUpload, pushToast],
  )

  const handleDelete = useCallback(
    async (photoId: number) => {
      setBusyId(photoId)
      try {
        await photoApi.deletePhoto(photoId)
        setPhotos((prev) => prev.filter((p) => p.photoId !== photoId))
        pushToast('Horoscope chart deleted.', 'success')
      } catch (err) {
        pushToast(apiErrorMessage(err, 'Could not delete the chart.'), 'error')
      } finally {
        setBusyId(null)
      }
    },
    [pushToast],
  )

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-foreground">
        Horoscope chart
        <span className="ml-1 font-normal text-muted-foreground">(optional)</span>
      </span>
      <p className="text-xs text-muted-foreground">
        Shared only with members you connect with, and requires admin approval. JPEG, PNG, or WEBP up
        to 5&nbsp;MB.
      </p>

      {photos.length > 0 && (
        <ul className="mt-1 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photo) => (
            <li
              key={photo.photoId}
              className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
            >
              <div className="relative aspect-square bg-muted">
                {photo.photoUrl ? (
                  <img
                    src={photo.thumbnailUrl ?? photo.photoUrl}
                    alt="Horoscope chart"
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center px-2 text-center text-xs text-muted-foreground">
                    Processing…
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2 p-2.5">
                <StatusBadge status={photo.status} />
                <Button
                  variant="danger"
                  size="sm"
                  loading={busyId === photo.photoId}
                  onClick={() => void handleDelete(photo.photoId)}
                  aria-label="Delete horoscope chart"
                >
                  <Icon name="trash" size={16} />
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!loading &&
        (canUpload ? (
          <div className="mt-1">
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT_ATTR}
              className="sr-only"
              onChange={(e) => void handleFile(e.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-card px-4 py-8 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-secondary hover:text-primary disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Icon name={uploading ? 'refresh' : 'upload'} size={22} />
              <span className="text-sm font-medium">
                {uploading ? 'Uploading…' : 'Upload chart'}
              </span>
              <span className="text-xs text-muted-foreground">
                JPG, PNG, or WEBP of your horoscope / jathagam
              </span>
            </button>
          </div>
        ) : (
          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <Icon name="alert-circle" size={16} />
            You&apos;ve reached the {MAX_HOROSCOPE_PHOTOS}-chart limit. Delete one to add another.
          </p>
        ))}

      <Toaster toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
    </div>
  )
}
