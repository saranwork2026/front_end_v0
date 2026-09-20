'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { PhotoResponse } from '@matrimony/shared-core'

import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { StatusBadge } from '@/components/ui/status-badge'
import { Toaster, type ToastItem } from '@/components/ui/toast'
import { photoApi } from '@/src/lib/api'
import { compressImageIfNeeded } from '@/src/lib/imageCompression'

const MAX_HOROSCOPE_PHOTOS = 2
// Compression target — oversized charts are downscaled in the browser before
// upload rather than rejected. Kept under the backend's 5 MB limit.
const COMPRESS_TARGET_BYTES = 4.5 * 1024 * 1024
const MAX_SELECT_BYTES = 25 * 1024 * 1024
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ACCEPT_ATTR = 'image/jpeg,image/png,image/webp'

type TFunc = ReturnType<typeof useTranslation>['t']

function validateFile(file: File, t: TFunc): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return t('page.photos.invalidFormat')
  }
  if (file.size > MAX_SELECT_BYTES) {
    return t('page.photos.tooLargeSelect')
  }
  return null
}

function apiErrorMessage(err: unknown, fallback: string, t: TFunc): string {
  const data = (err as { response?: { data?: { errorCode?: string; message?: string } } })?.response
    ?.data
  if (data?.errorCode === 'INVALID_PHOTO_TYPE' || data?.errorCode === 'INVALID_FILE_TYPE') {
    return t('page.photos.invalidFormat')
  }
  if (data?.errorCode === 'PHOTO_TOO_LARGE') return t('page.photos.tooLarge')
  if (data?.errorCode === 'PHOTO_LIMIT_REACHED') return t('page.photos.horoscopeLimitReached')
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
  const { t } = useTranslation()
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
      const validationError = validateFile(file, t)
      if (validationError) {
        pushToast(validationError, 'error')
        return
      }
      if (!canUpload) {
        pushToast(t('page.photos.maxHoroscopeToast', { max: MAX_HOROSCOPE_PHOTOS }), 'error')
        return
      }
      setUploading(true)
      try {
        const toUpload = await compressImageIfNeeded(file, COMPRESS_TARGET_BYTES)
        const res = await photoApi.uploadHoroscopePhoto(toUpload)
        setPhotos((prev) => [...prev, res.data])
        pushToast(t('page.photos.horoscopeUploaded'), 'success')
      } catch (err) {
        pushToast(apiErrorMessage(err, t('page.photos.uploadFailed'), t), 'error')
      } finally {
        setUploading(false)
        if (inputRef.current) inputRef.current.value = ''
      }
    },
    [canUpload, pushToast, t],
  )

  const handleDelete = useCallback(
    async (photoId: number) => {
      setBusyId(photoId)
      try {
        await photoApi.deletePhoto(photoId)
        setPhotos((prev) => prev.filter((p) => p.photoId !== photoId))
        pushToast(t('page.photos.horoscopeDeleted'), 'success')
      } catch (err) {
        pushToast(apiErrorMessage(err, t('page.photos.couldNotDeleteChart'), t), 'error')
      } finally {
        setBusyId(null)
      }
    },
    [pushToast, t],
  )

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-foreground">
        {t('page.photos.horoscopeChart')}
        <span className="ml-1 font-normal text-muted-foreground">{t('page.photos.optional')}</span>
      </span>
      <p className="text-xs text-muted-foreground">
        {t('page.photos.horoscopeHint')}
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
                    alt={t('page.photos.horoscopeAlt')}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center px-2 text-center text-xs text-muted-foreground">
                    {t('page.photos.processing')}
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
                  aria-label={t('page.photos.deleteHoroscope')}
                >
                  <Icon name="trash" size={16} />
                  {t('page.photos.delete')}
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
                {uploading ? t('page.photos.uploading') : t('page.photos.uploadChart')}
              </span>
              <span className="text-xs text-muted-foreground">
                {t('page.photos.uploadChartHint')}
              </span>
            </button>
          </div>
        ) : (
          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <Icon name="alert-circle" size={16} />
            {t('page.photos.horoscopeLimitHint', { max: MAX_HOROSCOPE_PHOTOS })}
          </p>
        ))}

      <Toaster toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
    </div>
  )
}
