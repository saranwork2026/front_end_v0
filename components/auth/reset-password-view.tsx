'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { AuthShell } from '@/components/auth/auth-shell'
import { IconInput } from '@/components/auth/icon-input'
import { OtpInput } from '@/components/auth/otp-input'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { checkPassword, isPasswordValid, OTP_RE, passwordRules } from '@/lib/auth-data'
import { validateWithSchema } from '@/lib/validation'
import type { ApiError } from '@matrimony/shared-core'
import { resetPasswordSchema } from '@matrimony/shared-core'
import { authApi } from '@/src/lib/api'

const errorKeys: Record<string, string> = {
  INVALID_OTP: 'auth.errInvalidOtp',
  OTP_EXPIRED: 'auth.errOtpExpired',
  OTP_ATTEMPTS_EXCEEDED: 'auth.errOtpAttempts',
}

interface ResetPasswordViewProps {
  profileId?: string
}

export function ResetPasswordView({ profileId = '' }: ResetPasswordViewProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const [pid, setPid] = useState(profileId)
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [banner, setBanner] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const checks = checkPassword(password)
  // Hide the rules once all are met (they'd otherwise linger while the user
  // fills the Confirm field below).
  const showChecklist = password.length > 0 && !isPasswordValid(password)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBanner(null)
    // Validate with the shared-core zod schema for cross-platform parity.
    const parsed = validateWithSchema(resetPasswordSchema, {
      profileId: pid.trim(),
      otp,
      newPassword: password,
      confirmPassword: confirm,
    })
    if (!parsed.success) {
      const next: Record<string, string> = {}
      if (parsed.errors.profileId) next.pid = parsed.errors.profileId
      if (parsed.errors.otp) next.otp = parsed.errors.otp
      if (parsed.errors.newPassword) next.password = parsed.errors.newPassword
      if (parsed.errors.confirmPassword) next.confirm = parsed.errors.confirmPassword
      setErrors(next)
      return
    }
    setErrors({})

    setLoading(true)
    try {
      await authApi.resetPassword({ profileId: pid.trim(), otp, newPassword: password })
      router.push('/login')
    } catch (err: unknown) {
      const apiError = (err as { response?: { data?: ApiError } })?.response?.data
      const code = apiError?.errorCode
      setBanner(code && errorKeys[code] ? code : `__RAW__${apiError?.message ?? t('auth.resetFailed')}`)
    } finally {
      setLoading(false)
    }
  }

  function bannerText(b: string): string {
    if (b.startsWith('__RAW__')) return b.slice('__RAW__'.length)
    return errorKeys[b] ? t(errorKeys[b] as never) : t('auth.resetFailed')
  }

  return (
    <AuthShell
      title={t('auth.resetTitle')}
      subtitle={t('auth.resetSubtitle')}
      footer={
        <Link href="/login" className="font-medium text-primary hover:underline">
          {t('auth.backToSignIn')}
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
          label={t('auth.profileId')}
          leadingIcon="user"
          placeholder={t('auth.profileIdPlaceholder')}
          value={pid}
          onChange={(e) => setPid(e.target.value)}
          error={errors.pid}
        />

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-foreground">{t('auth.verificationCode')}</span>
          <OtpInput value={otp} onChange={setOtp} verified={OTP_RE.test(otp)} ariaLabel={t('auth.resetCodeAria')} />
          {errors.otp && (
            <p role="alert" className="flex items-center gap-1 text-sm text-destructive">
              <Icon name="alert-circle" size={14} />
              {errors.otp}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <IconInput
            label={t('auth.newPassword')}
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
          label={t('auth.confirmNewPassword')}
          password
          leadingIcon="lock"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={errors.confirm}
        />

        <Button type="submit" size="lg" loading={loading} className="mt-1 w-full">
          {loading ? t('auth.resetting') : t('auth.resetPassword')}
        </Button>
      </form>
    </AuthShell>
  )
}
