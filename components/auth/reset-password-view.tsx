'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { AuthShell } from '@/components/auth/auth-shell'
import { IconInput } from '@/components/auth/icon-input'
import { OtpInput } from '@/components/auth/otp-input'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { checkPassword, isPasswordValid, OTP_RE, passwordRules } from '@/lib/auth-data'
import type { ApiError } from '@matrimony/shared-core'
import { authApi } from '@/src/lib/api'

const errorMessages: Record<string, string> = {
  INVALID_OTP: 'The code you entered is incorrect. Please check and try again.',
  OTP_EXPIRED: 'This code has expired. Please request a new one.',
  OTP_ATTEMPTS_EXCEEDED: 'Too many incorrect attempts. Please request a new code.',
}

interface ResetPasswordViewProps {
  profileId?: string
}

export function ResetPasswordView({ profileId = '' }: ResetPasswordViewProps) {
  const router = useRouter()
  const [pid, setPid] = useState(profileId)
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [banner, setBanner] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const checks = checkPassword(password)
  const showChecklist = password.length > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (!pid.trim()) next.pid = 'Enter your profile ID.'
    if (!OTP_RE.test(otp)) next.otp = 'Enter the 6-digit code.'
    if (!isPasswordValid(password)) next.password = 'Password does not meet the requirements below.'
    if (confirm !== password) next.confirm = 'Passwords do not match.'
    setErrors(next)
    setBanner(null)
    if (Object.keys(next).length > 0) return

    setLoading(true)
    try {
      await authApi.resetPassword({ profileId: pid.trim(), otp, newPassword: password })
      router.push('/login')
    } catch (err: unknown) {
      const apiError = (err as { response?: { data?: ApiError } })?.response?.data
      const code = apiError?.errorCode
      setBanner(code && errorMessages[code] ? code : `__RAW__${apiError?.message ?? 'Reset failed. Please try again.'}`)
    } finally {
      setLoading(false)
    }
  }

  function bannerText(b: string): string {
    if (b.startsWith('__RAW__')) return b.slice('__RAW__'.length)
    return errorMessages[b] ?? 'Reset failed. Please try again.'
  }

  return (
    <AuthShell
      title="Reset password"
      subtitle="Enter the code we sent and choose a new password."
      footer={
        <Link href="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {banner && (
          <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3.5 text-sm text-destructive">
            <Icon name="alert-circle" size={16} className="mt-0.5 shrink-0" />
            <span>{bannerText(banner)}</span>
          </div>
        )}

        <IconInput
          label="Profile ID"
          leadingIcon="user"
          placeholder="MGZ-100238"
          value={pid}
          onChange={(e) => setPid(e.target.value)}
          error={errors.pid}
        />

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-foreground">Verification code</span>
          <OtpInput value={otp} onChange={setOtp} verified={OTP_RE.test(otp)} ariaLabel="Reset verification code" />
          {errors.otp && (
            <p role="alert" className="flex items-center gap-1 text-sm text-destructive">
              <Icon name="alert-circle" size={14} />
              {errors.otp}
            </p>
          )}
        </div>

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
          {loading ? 'Resetting…' : 'Reset password'}
        </Button>
      </form>
    </AuthShell>
  )
}
