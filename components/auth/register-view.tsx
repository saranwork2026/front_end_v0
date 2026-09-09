'use client'

import Link from 'next/link'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { registerSchema, type RegisterFormValues, type ApiError } from '@matrimony/shared-core'

import { AuthShell } from '@/components/auth/auth-shell'
import { CaptchaField } from '@/components/auth/captcha-field'
import { IconInput } from '@/components/auth/icon-input'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { checkPassword, passwordRules } from '@/lib/auth-data'
import { authApi } from '@/src/lib/api'
import { isCaptchaDisabled } from '@/src/lib/captcha'
import { fieldError } from '@/src/lib/field-error'

const errorMessages: Record<string, string> = {
  USER_ALREADY_EXISTS: 'An account with this mobile number or email already exists.',
  CAPTCHA_VERIFICATION_FAILED: 'Captcha verification failed. Please try again.',
  RATE_LIMITED: 'Too many requests. Please wait a moment and try again.',
}

export function RegisterView() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  // Referral code arrives via an invite link (?ref=SM123). Captured silently.
  const referralCode = searchParams.get('ref')?.trim() || undefined

  const [terms, setTerms] = useState(false)
  const [termsError, setTermsError] = useState<string | undefined>()
  const [captcha, setCaptcha] = useState(isCaptchaDisabled())
  const [captchaError, setCaptchaError] = useState<string | undefined>()
  const [banner, setBanner] = useState<string | null>(null)
  const [passwordFocused, setPasswordFocused] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      mobileNo: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const passwordRegister = register('password')
  const passwordValue = watch('password') ?? ''
  const checks = checkPassword(passwordValue)
  const showChecklist = passwordFocused && passwordValue.length > 0

  const onSubmit = async (data: RegisterFormValues) => {
    setBanner(null)
    setCaptchaError(undefined)
    setTermsError(undefined)

    if (!terms) {
      setTermsError('Please accept the Terms of Service and Privacy Policy to continue.')
      return
    }
    if (!isCaptchaDisabled() && !captcha) {
      setCaptchaError('Please confirm you are not a robot.')
      return
    }

    try {
      const response = await authApi.register({
        firstName: data.firstName,
        lastName: data.lastName,
        mobileNo: data.mobileNo,
        email: data.email || undefined,
        password: data.password,
        captchaToken: isCaptchaDisabled() ? 'disabled' : 'checkbox-verified',
        referralCode,
      })

      // Backend mock mode (otp.mock-enabled) sends otpRequired=false: skip OTP.
      if (response.data.otpRequired === false) {
        navigate('/login', {
          state: { message: 'Your account is verified. Please sign in to continue.' },
        })
        return
      }

      navigate('/verify-otp', {
        state: {
          profileId: response.data.profileId,
          otpChannels: response.data.otpChannels,
          maskedMobile: (response.data as unknown as { maskedMobile?: string }).maskedMobile,
          maskedEmail: (response.data as unknown as { maskedEmail?: string }).maskedEmail,
        },
      })
    } catch (err: unknown) {
      const apiError = (err as { response?: { data?: ApiError } })?.response?.data
      const status = (err as { response?: { status?: number } })?.response?.status
      const code = apiError?.errorCode
      if (status === 429) setBanner('RATE_LIMITED')
      else if (code && errorMessages[code]) setBanner(code)
      else setBanner(apiError?.message ? `__RAW__${apiError.message}` : '__GENERIC__')
    }
  }

  function bannerText(b: string): string {
    if (b === '__GENERIC__') return 'Something went wrong. Please try again.'
    if (b.startsWith('__RAW__')) return b.slice('__RAW__'.length)
    return errorMessages[b] ?? 'Something went wrong. Please try again.'
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="A few details to begin. You will build your full profile next."
      banner={
        referralCode ? (
          <div className="mb-5 flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1.5 text-sm text-foreground">
            <Icon name="gift" size={16} className="text-gold-foreground" />
            <span>
              Invited by <span className="font-medium">{referralCode}</span>
            </span>
          </div>
        ) : undefined
      }
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        {banner && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3.5 text-sm text-destructive"
          >
            <Icon name="alert-circle" size={16} className="mt-0.5 shrink-0" />
            <span>{bannerText(banner)}</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <IconInput
            label="First name"
            leadingIcon="user"
            autoComplete="given-name"
            error={fieldError(errors.firstName?.message)}
            {...register('firstName')}
          />
          <IconInput
            label="Last name"
            leadingIcon="user"
            autoComplete="family-name"
            error={fieldError(errors.lastName?.message)}
            {...register('lastName')}
          />
        </div>

        <IconInput
          label="Mobile number"
          leadingIcon="phone"
          inputMode="numeric"
          autoComplete="tel"
          maxLength={10}
          placeholder="9876543210"
          error={fieldError(errors.mobileNo?.message)}
          {...register('mobileNo')}
        />

        <IconInput
          label="Email (optional)"
          leadingIcon="mail"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={fieldError(errors.email?.message)}
          {...register('email')}
        />

        <div className="flex flex-col gap-2">
          <IconInput
            label="Password"
            password
            blockPaste
            leadingIcon="lock"
            autoComplete="new-password"
            error={fieldError(errors.password?.message)}
            {...passwordRegister}
            onFocus={() => setPasswordFocused(true)}
            onBlur={(e) => {
              passwordRegister.onBlur(e)
              setPasswordFocused(false)
            }}
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
          label="Confirm password"
          password
          blockPaste
          leadingIcon="lock"
          autoComplete="new-password"
          error={fieldError(errors.confirmPassword?.message)}
          {...register('confirmPassword')}
        />

        <div className="flex flex-col gap-1.5">
          <label className="flex items-start gap-2.5 text-sm text-foreground">
            <input
              type="checkbox"
              checked={terms}
              onChange={(e) => {
                setTerms(e.target.checked)
                if (e.target.checked) setTermsError(undefined)
              }}
              className="mt-0.5 size-4 shrink-0 accent-primary"
            />
            <span>
              I agree to the{' '}
              <Link href="/terms" className="font-medium text-primary hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy-policy" className="font-medium text-primary hover:underline">
                Privacy Policy
              </Link>
              .
            </span>
          </label>
          {termsError && (
            <p role="alert" className="flex items-center gap-1 text-sm text-destructive">
              <Icon name="alert-circle" size={14} />
              {termsError}
            </p>
          )}
        </div>

        {!isCaptchaDisabled() && (
          <CaptchaField checked={captcha} onChange={setCaptcha} error={captchaError} />
        )}

        <Button type="submit" size="lg" loading={isSubmitting} className="mt-1 w-full">
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </AuthShell>
  )
}
