'use client'

import Link from 'next/link'
import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button, buttonVariants } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Icon } from '@/components/ui/icon'
import { Toaster, type ToastItem } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { accountApi, authStore } from '@/src/lib/api'

export function AccountView() {
  const navigate = useNavigate()

  const [deactivating, setDeactivating] = useState(false)
  const [activating, setActivating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const [toasts, setToasts] = useState<ToastItem[]>([])
  const pushToast = useCallback((message: string, variant: ToastItem['variant']) => {
    setToasts((prev) => [...prev, { id: Date.now() + Math.random(), message, variant }])
  }, [])
  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const handleDeactivate = useCallback(async () => {
    setDeactivating(true)
    try {
      await accountApi.deactivateAccount()
      pushToast('Your account has been deactivated.', 'success')
    } catch {
      pushToast('Could not deactivate your account. Please try again.', 'error')
    } finally {
      setDeactivating(false)
    }
  }, [pushToast])

  const handleActivate = useCallback(async () => {
    setActivating(true)
    try {
      await accountApi.activateAccount()
      pushToast('Your account has been reactivated.', 'success')
    } catch {
      pushToast('Could not reactivate your account. Please try again.', 'error')
    } finally {
      setActivating(false)
    }
  }, [pushToast])

  const handleDelete = useCallback(async () => {
    setDeleting(true)
    try {
      await accountApi.deleteAccount()
      authStore.getState().clearAuth()
      navigate('/login', { replace: true })
    } catch {
      pushToast('Could not delete your account. Please try again.', 'error')
      setDeleting(false)
      setShowDeleteDialog(false)
    }
  }, [navigate, pushToast])

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-10">
      <div className="mb-6">
        <h1 className="font-serif text-2xl text-foreground sm:text-3xl">Account settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your password and the status of your account.
        </p>
      </div>

      <div className="space-y-4">
        {/* Change password */}
        <SettingCard
          icon="lock"
          title="Change password"
          description="Update the password you use to sign in."
          action={
            <Link
              href="/change-password"
              className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }))}
            >
              Change
            </Link>
          }
        />

        {/* Deactivate */}
        <SettingCard
          icon="eye-off"
          title="Deactivate account"
          description="Temporarily hide your profile from search. You can reactivate anytime."
          action={
            <Button variant="secondary" size="sm" loading={deactivating} onClick={() => void handleDeactivate()}>
              Deactivate
            </Button>
          }
        />

        {/* Reactivate */}
        <SettingCard
          icon="refresh"
          title="Reactivate account"
          description="Restore your profile so it can appear in search again after review."
          action={
            <Button variant="primary" size="sm" loading={activating} onClick={() => void handleActivate()}>
              Reactivate
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
                <h2 className="text-base font-semibold text-foreground">Delete account</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Permanently delete your account and all associated data. This cannot be undone.
                </p>
              </div>
            </div>
            <div className="shrink-0">
              <Button variant="danger" size="sm" onClick={() => setShowDeleteDialog(true)}>
                Delete
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
        title="Delete your account?"
        description="This permanently deletes your profile, photos, messages, and all other data."
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button variant="danger" loading={deleting} onClick={() => void handleDelete()}>
              Delete permanently
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <Icon name="alert-circle" size={20} className="mt-0.5 shrink-0 text-destructive" />
          <p className="text-sm text-foreground">
            This action is <span className="font-semibold">irreversible</span>. Once deleted, your account
            and data cannot be recovered.
          </p>
        </div>
      </Dialog>

      <Toaster toasts={toasts} onDismiss={dismissToast} />
    </main>
  )
}

interface SettingCardProps {
  icon: 'lock' | 'eye-off' | 'refresh'
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
