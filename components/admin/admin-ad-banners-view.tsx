'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { AdBanner, AdBannerStatus } from '@matrimony/shared-core'

import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/ui/status-badge'
import { Toaster, type ToastItem } from '@/components/ui/toast'
import { adBannerApi } from '@/src/lib/api'

const TABS: { status: AdBannerStatus; label: string }[] = [
  { status: 'PENDING', label: 'Pending' },
  { status: 'UNDER_REVIEW', label: 'In review' },
  { status: 'APPROVED', label: 'Approved' },
  { status: 'REJECTED', label: 'Rejected' },
]

const ACCEPT = 'image/jpeg,image/png,image/webp'
const MAX_SIZE = 5 * 1024 * 1024

interface AdminAdBannersViewProps {
  /** Approver role unlocks delete (spec: delete is approver-only). */
  isApprover?: boolean
}

export function AdminAdBannersView({ isApprover = false }: AdminAdBannersViewProps) {
  const [tab, setTab] = useState<AdBannerStatus>('PENDING')
  const [banners, setBanners] = useState<AdBanner[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [toasts, setToasts] = useState<ToastItem[]>([])

  // Upload form
  const [title, setTitle] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [displayOrder, setDisplayOrder] = useState('0')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const pushToast = useCallback((message: string, variant: ToastItem['variant']) => {
    setToasts((t) => [...t, { id: Date.now() + Math.random(), message, variant }])
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await adBannerApi.listBanners({ status: tab, page: 0, size: 50 })
      setBanners(res.data.content ?? [])
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => {
    void load()
  }, [load])

  async function handleUpload(file: File | undefined) {
    if (!file) return
    if (!ACCEPT.split(',').includes(file.type)) {
      pushToast('Only JPEG, PNG, or WEBP images are allowed.', 'error')
      return
    }
    if (file.size > MAX_SIZE) {
      pushToast('Image is too large (max 5 MB).', 'error')
      return
    }
    setUploading(true)
    try {
      await adBannerApi.uploadBanner({
        image: file,
        title: title.trim() || undefined,
        linkUrl: linkUrl.trim() || undefined,
        displayOrder: Number(displayOrder) || 0,
      })
      pushToast('Banner uploaded. Raise it for approval when ready.', 'success')
      setTitle('')
      setLinkUrl('')
      setDisplayOrder('0')
      if (fileRef.current) fileRef.current.value = ''
      if (tab === 'PENDING') void load()
    } catch {
      pushToast('Upload failed. Please try again.', 'error')
    } finally {
      setUploading(false)
    }
  }

  async function raiseApproval(banner: AdBanner, approve: boolean) {
    setBusyId(banner.id)
    try {
      if (approve) await adBannerApi.requestApproval(banner.id)
      else await adBannerApi.requestRejection(banner.id)
      pushToast(
        approve
          ? 'Approval request raised for approver sign-off.'
          : 'Rejection request raised for approver sign-off.',
        'success',
      )
      setBanners((prev) => prev.filter((b) => b.id !== banner.id))
    } catch {
      pushToast('Could not raise the request. Try again.', 'error')
    } finally {
      setBusyId(null)
    }
  }

  async function remove(banner: AdBanner) {
    setBusyId(banner.id)
    try {
      await adBannerApi.deleteBanner(banner.id)
      pushToast('Banner deleted.', 'success')
      setBanners((prev) => prev.filter((b) => b.id !== banner.id))
    } catch {
      pushToast('Could not delete the banner.', 'error')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-2xl font-semibold text-foreground text-balance">Vendor ads</h1>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">
          Upload promotional banners for the customer dashboard. Each banner needs a second
          admin&apos;s approval before it goes live.
        </p>
      </header>

      {/* Upload */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-4 font-serif text-lg font-bold text-foreground">Upload a banner</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Diwali wedding offer" />
          <Input label="Link URL (optional)" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://…" />
          <Input label="Display order" type="number" inputMode="numeric" value={displayOrder} onChange={(e) => setDisplayOrder(e.target.value)} />
        </div>
        <div className="mt-4">
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPT}
            className="sr-only"
            onChange={(e) => void handleUpload(e.target.files?.[0])}
          />
          <Button variant="primary" loading={uploading} onClick={() => fileRef.current?.click()}>
            <Icon name="upload" size={18} />
            Choose image &amp; upload
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">JPEG, PNG, or WEBP. Up to 5 MB. Wide (4:1) images look best.</p>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Banner status">
        {TABS.map((t) => (
          <button
            key={t.status}
            type="button"
            role="tab"
            aria-selected={tab === t.status}
            onClick={() => setTab(t.status)}
            className={
              'min-h-9 rounded-full px-4 text-sm font-medium transition-colors ' +
              (tab === t.status ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground')
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/1] w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <div role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-sm text-destructive">Could not load banners.</p>
          <Button variant="secondary" size="sm" className="mt-3" onClick={() => void load()}>
            Retry
          </Button>
        </div>
      ) : banners.length === 0 ? (
        <p className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No {TABS.find((t) => t.status === tab)?.label.toLowerCase()} banners.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {banners.map((b) => (
            <li key={b.id} className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="aspect-[4/1] bg-muted">
                <img src={b.imageUrl} alt={b.title ?? 'Banner'} className="h-full w-full object-cover" loading="lazy" />
              </div>
              <div className="flex flex-col gap-2 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-foreground">{b.title || 'Untitled banner'}</p>
                  <StatusBadge status={b.status} />
                </div>
                <p className="text-xs text-muted-foreground">Order: {b.displayOrder}</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {tab === 'PENDING' && (
                    <>
                      <Button size="sm" loading={busyId === b.id} onClick={() => void raiseApproval(b, true)}>
                        <Icon name="check" size={15} /> Raise approve
                      </Button>
                      <Button size="sm" variant="secondary" disabled={busyId === b.id} onClick={() => void raiseApproval(b, false)}>
                        Raise reject
                      </Button>
                    </>
                  )}
                  {isApprover && (
                    <Button size="sm" variant="danger" loading={busyId === b.id} onClick={() => void remove(b)}>
                      <Icon name="trash" size={15} /> Delete
                    </Button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Toaster toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
    </div>
  )
}
