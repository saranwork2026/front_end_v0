'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { AuthShell } from '@/components/auth/auth-shell'
import { IconInput } from '@/components/auth/icon-input'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Toaster, type ToastItem } from '@/components/ui/toast'
import { checkPassword, isPasswordValid, passwordRules } from '@/lib/auth-data'
import type { ApiError } from '@matrimony/shared-core'
import { authApi } from '@/src/lib/api'

interface ChangePasswordViewProps {
  /** Forced-first-login mode shows an amber notice and redirects to "/" on success. */
  forced?: boolean
}

export function ChangePasswordView({ forced = false }: ChangePasswordViewProps) {
  const router = useRouter()
  const [current, setCurrent] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const checks = checkPassword(password)
  const showChecklist = password.length > 0

  function pushToast(message: string, variant: ToastItem['variant']) {
    setToasts((t) => [...t, { id: Date.now() + t.length, message, variant }])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (!current) next.current = 'Enter your current password.'
    if (!isPasswordValid(password)) next.password = 'Password does not meet the requirements below.'
    if (confirm !== password) next.confirm = 'Passwords do not match.'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setLoading(true)
    try {
      await authApi.changePassword({ currentPassword: current, newPassword: password })
      pushToast('Password updated successfully.', 'success')
      if (forced) setTimeout(() => router.push('/'), 700)
      else {
        setCurrent('')
        setPassword('')
        setConfirm('')
      }
    } catch (err: unknown) {
      const apiError = (err as { response?: { data?: ApiError } })?.response?.data
      if (apiError?.errorCode === 'INVALID_CREDENTIALS') {
        setErrors({ current: 'The current password is incorrect.' })
      } else {
        pushToast(apiError?.message ?? 'Something went wrong.', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Change password"
      subtitle="Choose a strong password you do not use elsewhere."
      banner={
        forced ? (
          <div className="mb-5 flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-foreground">
            <Icon name="alert-circle" size={16} className="mt-0.5 shrink-0 text-warning" />
            <span>For your security, please set a new password before continuing.</span>
          </div>
        ) : undefined
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <IconInput
          label="Current password"
          password
          leadingIcon="lock"
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          error={errors.current}
        />

        <div className="flex flex-col gap-2">
          <IconInput
            label="New password"
            password
            leadingIcon="lock"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />
          {showChecklist && (
            <ul className="grid grid-cols-1 gap-1 rounded-lg bg-muted/60 p-3 sm:grid-cols-2">
              {passwordRules.map((rule) => {
                const met = checks[rule.key]
                return (
                  <li
                    key={rule.key}
                    className={`flex items-center gap-1.5 text-xs ${met ? 'text-success' : 'text-muted-foreground'}`}
                  >
                    <Icon name={met ? 'circle-check' : 'alert-circle'} size={13} />
                    {rule.label}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <IconInput
          label="Confirm new password"
          password
          leadingIcon="lock"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={errors.confirm}
        />

        <Button type="submit" size="lg" loading={loading} className="mt-1 w-full">
          {loading ? 'Updating…' : 'Update password'}
        </Button>
      </form>
      <Toaster toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
    </AuthShell>
  )
}
