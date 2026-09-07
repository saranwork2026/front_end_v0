'use client'

import Link from 'next/link'
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginFormValues, type ApiError } from '@matrimony/shared-core'

import { AuthShell } from '@/components/auth/auth-shell'
import { CaptchaField } from '@/components/auth/captcha-field'
import { IconInput } from '@/components/auth/icon-input'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { authApi, authStore } from '@/src/lib/api'
import { isCaptchaDisabled } from '@/src/lib/captcha'
import { fieldError } from '@/src/lib/field-error'

// Human-readable messages for the backend error codes the login flow maps.
const errorMessages: Record<string, string> = {
  INVALID_CREDENTIALS: 'The mobile number / email or password is incorrect.',
  USER_OTP_PENDING: 'Your account is not verified yet. Please verify the OTP to continue.',
  USER_BLOCKED: 'This account has been blocked. Please contact support for help.',
  ACCOUNT_LOCKED: 'Too many attempts. Your account is temporarily locked — try again later.',
  CAPTCHA_VERIFICATION_FAILED: 'Captcha verification failed. Please try again.',
  RATE_LIMITED: 'Too many requests. Please wait a moment and try again.',
}

export function LoginView() {
  const navigate = useNavigate()
  const location = useLocation()

  const from = (location.state as { from?: { pathname?: string } | string })?.from
  const redirectTo = typeof from === 'string' ? from : from?.pathname || '/'

  const [captcha, setCaptcha] = useState(isCaptchaDisabled())
  const [captchaError, setCaptchaError] = useState<string | undefined>()
  const [banner, setBanner] = useState<string | null>(null)
  const [showVerifyLink, setShowVerifyLink] = useState(false)

  // Success message passed via navigation state (e.g. from OTP verify / reset).
  const [infoMessage, setInfoMessage] = useState<string | null>(
    (location.state as { message?: string } | null)?.message ?? null,
  )
  useEffect(() => {
    if (infoMessage) window.history.replaceState({}, document.title)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
  })

  const onSubmit = async (data: LoginFormValues) => {
    setBanner(null)
    setShowVerifyLink(false)
    setCaptchaError(undefined)
    setInfoMessage(null)

    if (!isCaptchaDisabled() && !captcha) {
      setCaptchaError('Please confirm you are not a robot.')
      return
    }

    try {
      const response = await authApi.login({
        identifier: data.identifier,
        password: data.password,
        captchaToken: isCaptchaDisabled() ? 'disabled' : 'checkbox-verified',
      })

      const {
        profileId,
        userId,
        role,
        userStatus,
        profileStatus,
        profileCompletionPct,
        mustChangePassword,
      } = response.data

      // HttpOnly cookies are set by the backend; store the session in memory.
      authStore.getState().setSession({
        profileId,
        userId,
        role,
        userStatus,
        profileStatus,
        profileCompletionPct,
      })

      // Priority-based redirect (mirrors the existing app).
      if (mustChangePassword) {
        navigate('/change-password', { replace: true, state: { forced: true } })
        return
      }
      if (userStatus === 'DEACTIVATED') {
        navigate('/account/reactivate', { replace: true, state: { from: redirectTo } })
        return
      }
      const isAdmin = role === 'ADMIN_REQUESTER' || role === 'ADMIN_APPROVER'
      if (isAdmin && redirectTo === '/') {
        navigate('/admin', { replace: true })
        return
      }
      navigate(redirectTo, { replace: true })
    } catch (err: unknown) {
      const apiError = (err as { response?: { data?: ApiError } })?.response?.data
      const status = (err as { response?: { status?: number } })?.response?.status
      const code = apiError?.errorCode
      if (code === 'USER_OTP_PENDING') setShowVerifyLink(true)
      if (status === 429) {
        setBanner('RATE_LIMITED')
      } else if (code && errorMessages[code]) {
        setBanner(code)
      } else {
        setBanner(apiError?.message ? `__RAW__${apiError.message}` : '__GENERIC__')
      }
    }
  }

  function bannerText(b: string): string {
    if (b === '__GENERIC__') return 'Something went wrong. Please try again.'
    if (b.startsWith('__RAW__')) return b.slice('__RAW__'.length)
    return errorMessages[b] ?? 'Something went wrong. Please try again.'
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue your search for the right match."
      footer={
        <>
          New to Magizh?{' '}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        {infoMessage && (
          <div
            role="status"
            className="rounded-lg border border-success/30 bg-success/5 p-3.5 text-sm text-success"
          >
            {infoMessage}
          </div>
        )}

        {banner && (
          <div
            role="alert"
            className="flex flex-col gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3.5 text-sm text-destructive"
          >
            <span className="flex items-start gap-2">
              <Icon name="alert-circle" size={16} className="mt-0.5 shrink-0" />
              <span>{bannerText(banner)}</span>
            </span>
            {showVerifyLink && (
              <RouterLink
                to="/verify-otp"
                state={{ identifier: getValues('identifier') }}
                className="pl-6 font-medium underline"
              >
                Verify your account
              </RouterLink>
            )}
            {banner === 'USER_BLOCKED' && (
              <RouterLink to="/support" className="pl-6 font-medium underline">
                Contact support
              </RouterLink>
            )}
          </div>
        )}

        <IconInput
          label="Mobile number or email"
          leadingIcon="user"
          autoComplete="username"
          inputMode="text"
          placeholder="9876543210"
          error={fieldError(errors.identifier?.message)}
          {...register('identifier')}
        />

        <IconInput
          label="Password"
          password
          leadingIcon="lock"
          autoComplete="current-password"
          placeholder="Enter your password"
          error={fieldError(errors.password?.message)}
          {...register('password')}
        />

        {!isCaptchaDisabled() && (
          <CaptchaField checked={captcha} onChange={setCaptcha} error={captchaError} />
        )}

        <Button type="submit" size="lg" loading={isSubmitting} className="mt-1 w-full">
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>

        <Link
          href="/forgot-password"
          className="text-center text-sm font-medium text-primary hover:underline"
        >
          Forgot password?
        </Link>
      </form>
    </AuthShell>
  )
}
