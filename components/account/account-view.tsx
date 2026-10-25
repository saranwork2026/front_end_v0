'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import type { DocumentType, IdVerification } from '@matrimony/shared-core'

import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Icon, type IconName } from '@/components/ui/icon'
import { Select } from '@/components/ui/select'
import { Toaster, type ToastItem } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { accountApi, authStore, profileApi, verificationApi } from '@/src/lib/api'
import { compressImageIfNeeded } from '@/src/lib/imageCompression'

// Compression target for ID images: large phone photos of an ID are
// auto-downscaled/re-encoded in the browser before upload (kept under the
// backend's limit with margin). PDFs pass through untouched (the compressor is
// a no-op for non-image files).
const ID_COMPRESS_TARGET_BYTES = 4.5 * 1024 * 1024

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'AADHAAR', label: 'Aadhaar' },
  { value: 'PAN', label: 'PAN' },
  { value: 'PASSPORT', label: 'Passport' },
  { value: 'DRIVING_LICENSE', label: 'Driving license' },
  { value: 'VOTER_ID', label: 'Voter ID' },
  { value: 'OTHER', label: 'Other document' },
]

export function AccountView() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [deactivating, setDeactivating] = useState(false)
  const [activating, setActivating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Appear-offline privacy toggle.
  const [appearOffline, setAppearOffline] = useState(false)
  const [togglingOffline, setTogglingOffline] = useState(false)

  // ID verification.
  const [verification, setVerification] = useState<IdVerification | null>(null)
  const [docType, setDocType] = useState<DocumentType>('AADHAAR')
  const [docFile, setDocFile] = useState<File | null>(null)
  const [submittingDoc, setSubmittingDoc] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [toasts, setToasts] = useState<ToastItem[]>([])
  const pushToast = useCallback((message: string, variant: ToastItem['variant']) => {
    setToasts((prev) => [...prev, { id: Date.now() + Math.random(), message, variant }])
  }, [])
  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // Load current privacy setting + latest verification status on mount.
  useEffect(() => {
    let cancelled = false
    void profileApi
      .getProfile()
      .then((res) => {
        if (!cancelled) setAppearOffline(Boolean((res.data as { appearOffline?: boolean }).appearOffline))
      })
      .catch(() => {})
    void verificationApi
      .getMyLatest()
      .then((res) => {
        if (!cancelled) setVerification(res.data ?? null)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const handleToggleOffline = useCallback(async () => {
    const next = !appearOffline
    setTogglingOffline(true)
    try {
      await accountApi.setAppearOffline(next)
      setAppearOffline(next)
      pushToast(
        next ? t('page.account.appearOfflineOnToast') : t('page.account.appearOfflineOffToast'),
        'success',
      )
    } catch {
      pushToast(t('page.account.appearOfflineError'), 'error')
    } finally {
      setTogglingOffline(false)
    }
  }, [appearOffline, pushToast, t])

  const handleSubmitDoc = useCallback(async () => {
    if (!docFile) {
      pushToast(t('page.account.verifyIdNoFile'), 'error')
      return
    }
    setSubmittingDoc(true)
    try {
      // Auto-reduce an oversized ID image in the browser before upload. The
      // compressor is a no-op for PDFs, so documents pass through untouched.
      // Never log the document contents — only its (non-sensitive) size/type.
      const toUpload = await compressImageIfNeeded(docFile, ID_COMPRESS_TARGET_BYTES)
      if (toUpload.size !== docFile.size) {
        console.info(
          `[id-verification] compressed ${docFile.type} ${docFile.size} -> ${toUpload.size} bytes before upload`,
        )
      }
      const res = await verificationApi.submit(docType, toUpload)
      setVerification(res.data ?? null)
      setDocFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      pushToast(t('page.account.verifyIdSubmittedToast'), 'success')
    } catch (err) {
      console.error('[id-verification] submit failed', err)
      pushToast(t('page.account.verifyIdError'), 'error')
    } finally {
      setSubmittingDoc(false)
    }
  }, [docFile, docType, pushToast, t])

  const handleDeactivate = useCallback(async () => {
    setDeactivating(true)
    try {
      await accountApi.deactivateAccount()
      pushToast(t('page.account.deactivatedToast'), 'success')
    } catch {
      pushToast(t('page.account.deactivateError'), 'error')
    } finally {
      setDeactivating(false)
    }
  }, [pushToast, t])

  const handleActivate = useCallback(async () => {
    setActivating(true)
    try {
      await accountApi.activateAccount()
      pushToast(t('page.account.reactivatedToast'), 'success')
    } catch {
      pushToast(t('page.account.reactivateError'), 'error')
    } finally {
      setActivating(false)
    }
  }, [pushToast, t])

  const handleDelete = useCallback(async () => {
    setDeleting(true)
    try {
      await accountApi.deleteAccount()
      authStore.getState().clearAuth()
      navigate('/login', { replace: true })
    } catch {
      pushToast(t('page.account.deleteError'), 'error')
      setDeleting(false)
      setShowDeleteDialog(false)
    }
  }, [navigate, pushToast, t])

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-10">
      <div className="mb-6">
        <h1 className="font-serif text-2xl text-foreground sm:text-3xl">{t('page.account.title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('page.account.subtitle')}
        </p>
      </div>

      <div className="space-y-4">
        {/* Change password */}
        <SettingCard
          icon="lock"
          title={t('page.account.changePwTitle')}
          description={t('page.account.changePwDesc')}
          action={
            <Link
              href="/change-password"
              className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }))}
            >
              {t('page.account.changePwCta')}
            </Link>
          }
        />

        {/* Verify your ID */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
              <Icon name="shield" size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-foreground">{t('page.account.verifyIdTitle')}</h2>
                {verification?.status === 'APPROVED' && (
                  <Badge variant="success">
                    <Icon name="circle-check" size={14} />
                    {t('page.account.verifyIdApproved')}
                  </Badge>
                )}
                {verification?.status === 'PENDING' && (
                  <Badge variant="warning">
                    <Icon name="clock" size={14} />
                    {t('page.account.verifyIdPending')}
                  </Badge>
                )}
                {verification?.status === 'REJECTED' && (
                  <Badge variant="danger">
                    <Icon name="alert-circle" size={14} />
                    {t('page.account.verifyIdRejected')}
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{t('page.account.verifyIdDesc')}</p>

              {verification?.status === 'REJECTED' && verification.reviewNote && (
                <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  <span className="font-medium">{t('page.account.verifyIdReasonLabel')}</span>{' '}
                  {verification.reviewNote}
                </p>
              )}

              {/* Upload form — shown unless a review is in progress or already approved. */}
              {verification?.status !== 'PENDING' && verification?.status !== 'APPROVED' && (
                <div className="mt-4 flex flex-col gap-3 sm:max-w-sm">
                  <Select
                    label={t('page.account.verifyIdDocTypeLabel')}
                    value={docType}
                    onChange={(e) => setDocType(e.target.value as DocumentType)}
                  >
                    {DOCUMENT_TYPES.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </Select>
                  <div>
                    <label htmlFor="id-doc-file" className="mb-1.5 block text-sm font-medium text-foreground">
                      {t('page.account.verifyIdFileLabel')}
                    </label>
                    <input
                      id="id-doc-file"
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
                      className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary hover:file:bg-secondary/80"
                    />
                  </div>
                  <div>
                    <Button
                      size="sm"
                      loading={submittingDoc}
                      disabled={!docFile}
                      onClick={() => void handleSubmitDoc()}
                      className="gap-1.5"
                    >
                      <Icon name="upload" size={16} />
                      {t('page.account.verifyIdSubmitCta')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Appear offline (privacy) */}
        <SettingCard
          icon={appearOffline ? 'eye-off' : 'eye'}
          title={t('page.account.appearOfflineTitle')}
          description={t('page.account.appearOfflineDesc')}
          action={
            <Button
              variant={appearOffline ? 'primary' : 'secondary'}
              size="sm"
              loading={togglingOffline}
              onClick={() => void handleToggleOffline()}
            >
              {appearOffline ? t('page.account.appearOfflineOnCta') : t('page.account.appearOfflineOffCta')}
            </Button>
          }
        />

        {/* Deactivate */}
        <SettingCard
          icon="eye-off"
          title={t('page.account.deactivateTitle')}
          description={t('page.account.deactivateDesc')}
          action={
            <Button variant="secondary" size="sm" loading={deactivating} onClick={() => void handleDeactivate()}>
              {t('page.account.deactivateCta')}
            </Button>
          }
        />

        {/* Reactivate */}
        <SettingCard
          icon="refresh"
          title={t('page.account.reactivateTitle')}
          description={t('page.account.reactivateDesc')}
          action={
            <Button variant="primary" size="sm" loading={activating} onClick={() => void handleActivate()}>
              {t('page.account.reactivateCta')}
            </Button>
          }
        />

        {/* Delete (danger) */}
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <Icon name="trash" size={20} />
              </span>
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-foreground">{t('page.account.deleteTitle')}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('page.account.deleteDesc')}
                </p>
              </div>
            </div>
            <div className="shrink-0">
              <Button variant="danger" size="sm" onClick={() => setShowDeleteDialog(true)}>
                {t('page.account.deleteCta')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog
        open={showDeleteDialog}
        onClose={() => {
          if (!deleting) setShowDeleteDialog(false)
        }}
        title={t('page.account.deleteDialogTitle')}
        description={t('page.account.deleteDialogDesc')}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleting}
            >
              {t('common.cancel')}
            </Button>
            <Button variant="danger" loading={deleting} onClick={() => void handleDelete()}>
              {t('page.account.deletePermanently')}
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <Icon name="alert-circle" size={20} className="mt-0.5 shrink-0 text-destructive" />
          <p className="text-sm text-foreground">
            {t('page.account.deleteWarningPre')}
            <span className="font-semibold">{t('page.account.deleteWarningIrreversible')}</span>
            {t('page.account.deleteWarningPost')}
          </p>
        </div>
      </Dialog>

      <Toaster toasts={toasts} onDismiss={dismissToast} />
    </main>
  )
}

interface SettingCardProps {
  icon: IconName
  title: string
  description: string
  action: React.ReactNode
}

function SettingCard({ icon, title, description, action }: SettingCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
            <Icon name={icon} size={20} />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="shrink-0">{action}</div>
      </div>
    </div>
  )
}
