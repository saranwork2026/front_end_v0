'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Toaster, type ToastItem } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { photoApi } from '@/src/lib/api'
import type { PhotoResponse } from '@matrimony/shared-core'

/**
 * Profile picture (DP) section — Section 1 of the two-section photo UI.
 *
 * Shows the member's chosen DP inside a circular preview that matches how the
 * avatar renders everywhere, and lets them DRAG the image to position their
 * face (the "fit"). The position is stored as a focal point (CSS
 * object-position %, 0–100) via PUT /user/photos/{id}/focus, so the same
 * face-centered crop is used across the header avatar, profile hero and cards.
 *
 * The DP is the member's primary photo. If they have multiple approved photos
 * they can pick which one is the DP here. Additional (gallery) photos are
 * managed separately by {@link PhotoManager}.
 *
 * This is a sibling of PhotoManager (not an edit of it) so the two-section
 * layout composes without touching the existing gallery manager.
 */
export function ProfileDpManager() {
  const [photos, setPhotos] = useState<PhotoResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  // Live focal point being edited (percent 0–100). Mirrors the selected photo.
  const [focal, setFocal] = useState<{ x: number; y: number }>({ x: 50, y: 50 })
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [busy, setBusy] = useState(false)
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const frameRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const pushToast = useCallback((message: string, variant: ToastItem['variant']) => {
    setToasts((prev) => [...prev, { id: Date.now() + Math.random(), message, variant }])
  }, [])
  const dismissToast = useCallback((id: number) => setToasts((prev) => prev.filter((t) => t.id !== id)), [])

  // Approved photos are the only DP candidates (others aren't shown publicly).
  const approved = photos.filter((p) => !p.isDeleted && p.status === 'APPROVED')
  const selected = approved.find((p) => p.photoId === selectedId) ?? null
  const dpUrl = selected?.thumbnailUrl ?? selected?.photoUrl ?? null

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await photoApi.listPhotos()
      const live = (res.data ?? []).filter((p) => !p.isDeleted)
      setPhotos(live)
      // Default the DP to the current primary (or first approved photo).
      const primary = live.find((p) => p.isPrimary && p.status === 'APPROVED')
      const initial = primary ?? live.find((p) => p.status === 'APPROVED') ?? null
      if (initial) {
        setSelectedId(initial.photoId)
        setFocal({ x: initial.focalX ?? 50, y: initial.focalY ?? 50 })
        setDirty(false)
      }
    } catch {
      // Best-effort — the additional-photos section surfaces load errors.
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  // When the user switches which photo is the DP, seed the editor from it.
  function selectPhoto(p: PhotoResponse) {
    setSelectedId(p.photoId)
    setFocal({ x: p.focalX ?? 50, y: p.focalY ?? 50 })
    setDirty(false)
  }

  // Convert a pointer position within the circular frame to a focal point.
  // Dragging moves the visible region: dragging the image down should reveal
  // the top, so we map cursor position directly to object-position percent.
  function updateFocalFromPointer(clientX: number, clientY: number) {
    const el = frameRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = Math.round(((clientX - rect.left) / rect.width) * 100)
    const y = Math.round(((clientY - rect.top) / rect.height) * 100)
    setFocal({ x: clamp(x), y: clamp(y) })
    setDirty(true)
  }

  function onPointerDown(e: React.PointerEvent) {
    if (!dpUrl) return
    dragging.current = true
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    updateFocalFromPointer(e.clientX, e.clientY)
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current) return
    updateFocalFromPointer(e.clientX, e.clientY)
  }
  function onPointerUp() {
    dragging.current = false
  }

  async function saveFocus() {
    if (!selected || !dirty) return
    setSaving(true)
    try {
      await photoApi.setPhotoFocus(selected.photoId, focal.x, focal.y)
      setPhotos((prev) =>
        prev.map((p) => (p.photoId === selected.photoId ? { ...p, focalX: focal.x, focalY: focal.y } : p)),
      )
      setDirty(false)
      pushToast('Profile picture position saved.', 'success')
    } catch {
      pushToast('Could not save the position. Please try again.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function makeDp(p: PhotoResponse) {
    if (p.isPrimary) return
    setBusy(true)
    try {
      await photoApi.setPrimary(p.photoId)
      setPhotos((prev) => prev.map((x) => ({ ...x, isPrimary: x.photoId === p.photoId })))
      selectPhoto(p)
      pushToast('Profile picture updated.', 'success')
    } catch {
      pushToast('Could not set this as your profile picture.', 'error')
    } finally {
      setBusy(false)
    }
  }

  const objectPosition = `${focal.x}% ${focal.y}%`

  return (
    <section aria-labelledby="dp-heading" className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="mb-4">
        <h2 id="dp-heading" className="font-serif text-lg font-bold text-foreground">
          Profile picture
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This is your display picture (DP) shown across the app. Drag the photo to position your face
          inside the circle, then save.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-4">
          <div className="size-28 animate-pulse rounded-full bg-secondary" />
          <div className="h-4 w-40 animate-pulse rounded bg-secondary" />
        </div>
      ) : !dpUrl ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-secondary/40 px-6 py-8 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-card text-primary shadow-sm">
            <Icon name="user" size={26} />
          </span>
          <p className="text-sm font-medium text-foreground">No approved photo yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Upload a photo in the “Additional photos” section below. Once it’s approved you can set it as
            your profile picture and position your face here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          {/* Circular DP preview — drag to reposition. Matches the avatar crop. */}
          <div className="flex flex-col items-center gap-2">
            <div
              ref={frameRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              className="relative size-40 cursor-grab touch-none overflow-hidden rounded-full border-2 border-gold/70 bg-secondary active:cursor-grabbing"
              role="img"
              aria-label="Profile picture preview — drag to reposition"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={dpUrl}
                alt=""
                draggable={false}
                className="h-full w-full select-none object-cover"
                style={{ objectPosition }}
              />
              <span className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-foreground/10" />
            </div>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Icon name="camera" size={13} /> Drag to fit your face
            </span>
          </div>

          {/* Controls: which photo is the DP + save position. */}
          <div className="flex w-full flex-1 flex-col gap-4">
            {approved.length > 1 && (
              <div>
                <p className="mb-2 text-sm font-medium text-foreground">Choose your profile picture</p>
                <div className="flex flex-wrap gap-2">
                  {approved.map((p) => {
                    const thumb = p.thumbnailUrl ?? p.photoUrl ?? ''
                    const isSel = p.photoId === selectedId
                    return (
                      <button
                        key={p.photoId}
                        type="button"
                        onClick={() => selectPhoto(p)}
                        onDoubleClick={() => void makeDp(p)}
                        aria-pressed={isSel}
                        aria-label={p.isPrimary ? 'Current profile picture' : 'Use as profile picture'}
                        className={cn(
                          'relative size-14 shrink-0 overflow-hidden rounded-lg border-2 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/60',
                          isSel ? 'border-primary' : 'border-transparent opacity-80 hover:opacity-100',
                        )}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={thumb}
                          alt=""
                          className="h-full w-full object-cover"
                          style={{ objectPosition: `${p.focalX ?? 50}% ${p.focalY ?? 50}%` }}
                        />
                        {p.isPrimary && (
                          <span className="absolute bottom-0 inset-x-0 bg-primary/85 py-0.5 text-center text-[9px] font-semibold text-primary-foreground">
                            DP
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              {selected && !selected.isPrimary && (
                <Button variant="secondary" size="sm" onClick={() => void makeDp(selected)} loading={busy}>
                  <Icon name="user" size={16} /> Set as profile picture
                </Button>
              )}
              <Button size="sm" onClick={() => void saveFocus()} loading={saving} disabled={!dirty}>
                <Icon name="check" size={16} /> {dirty ? 'Save position' : 'Position saved'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Toaster toasts={toasts} onDismiss={dismissToast} />
    </section>
  )
}

function clamp(v: number): number {
  return Math.max(0, Math.min(100, v))
}
