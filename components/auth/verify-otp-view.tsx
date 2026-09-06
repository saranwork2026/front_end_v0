'use client'

import Link from 'next/link'
import { useNavigate, useLocation } from 'react-router-dom'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ApiError } from '@matrimony/shared-core'

import { AuthShell } from '@/components/auth/auth-shell'
import { OtpInput } from '@/components/auth/otp-input'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { authApi } from '@/src/lib/api'

const RESEND_COOLDOWN = 60
const MAX_RESENDS = 3
const OTP_RE = /^\d{6}$/

const errorMessages: Record<string, string> = {
  INVALID_OTP: 'The code you entered is incorrect. Please check and try again.',
  OTP_EXPIRED: 'This code has expired. Please request a new one.',
  OTP_ATTEMPTS_EXCEEDED: 'Too many incorrect attempts. Please request a new code.',
  RATE_LIMITED: 'Too many requests. Please wait a moment and try again.',
}

type Channel = 'SMS' | 'EMAIL'

interface LocationState {
  profileId?: string
  otpChannels?: string[]
  identifier?: string
}

/** Per-channel resend state: how many resends used + seconds left on cooldown. */
interface ResendState {
  count: number
  cooldown: number
}

export function VerifyOtpView() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state as LocationState | null) ?? {}

  const testBypass = import.meta.env.VITE_OTP_TEST_BYPASS_CODE || ''

  const [profileId, setProfileId] = useState<string | undefined>(state.profileId)
  const [otpChannels, setOtpChannels] = useState<string[]>(state.otpChannels ?? ['SMS', 'EMAIL'])
  const emailChannel = otpChannels.some((c) => c.toUpperCase() === 'EMAIL')

  const [smsOtp, setSmsOtp] = useState(testBypass)
  const [emailOtp, setEmailOtp] = useState(emailChannel ? testBypass : '')

  // Per-channel verified flags. Once a channel verifies (partial success), it
  // locks so we stop re-sending / re-submitting its code.
  const [smsVerified, setSmsVerified] = useState(false)
  const [emailVerified, setEmailVerified] = useState(false)

  // Independent resend cooldowns/counts per channel (business rule: 60s
  // cooldown, max 3 resends — each channel tracked separately).
  const [smsResend, setSmsResend] = useState<ResendState>({ count: 0, cooldown: RESEND_COOLDOWN })
  const [emailResend, setEmailResend] = useState<ResendState>({ count: 0, cooldown: RESEND_COOLDOWN })

  const [error, setError] = useState<string | null>(null)
  const [partial, setPartial] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const submittedRef = useRef(false)

  // Lookup fallback: user landed here without register-flow state (e.g. via the
  // "Verify your account" link after a USER_OTP_PENDING login). Reconstruct
  // profileId + channels from the identifier.
  const [lookupNeeded, setLookupNeeded] = useState(!state.profileId)
  const [lookupIdentifier, setLookupIdentifier] = useState(state.identifier ?? '')
  const [lookupLoading, setLookupLoading] = useState(false)

  // SMS cooldown timer.
  useEffect(() => {
    if (smsResend.cooldown <= 0) return
    const t = setInterval(() => {
      setSmsResend((prev) => ({ ...prev, cooldown: Math.max(0, prev.cooldown - 1) }))
    }, 1000)
    return () => clearInterval(t)
  }, [smsResend.cooldown])

  // Email cooldown timer (only while the email channel is in play).
  useEffect(() => {
    if (!emailChannel || emailResend.cooldown <= 0) return
    const t = setInterval(() => {
      setEmailResend((prev) => ({ ...prev, cooldown: Math.max(0, prev.cooldown - 1) }))
    }, 1000)
    return () => clearInterval(t)
  }, [emailChannel, emailResend.cooldown])

  const submit = useCallback(async () => {
    if (submittedRef.current || !profileId) return
    submittedRef.current = true
    setLoading(true)
    setError(null)
    setPartial(null)
    try {
      const response = await authApi.verifyOtp({
        profileId,
        smsOtp,
        // Only send the email code when the email channel is still unverified.
        emailOtp: emailChannel && !emailVerified ? emailOtp : undefined,
      })
      const data = response.data

      if (data.userActivated) {
        navigate('/login', {
          state: { message: 'Your account is verified. Please sign in to continue.' },
        })
        return
      }

      // Partial success: reflect each channel's verified flag and keep the
      // still-pending channel active for another attempt.
      if (data.smsVerified) setSmsVerified(true)
      if (data.emailVerified) setEmailVerified(true)

      if (data.smsVerified && emailChannel && !data.emailVerified) {
        // SMS done, email still needs a valid code — clear it for retry.
        setEmailOtp(testBypass)
        setPartial(
          data.emailError ||
            'Your mobile number is verified. Please enter the code sent to your email.',
        )
      } else {
        setError(`__RAW__${data.message || 'Please check the codes and try again.'}`)
      }
    } catch (err: unknown) {
      const apiError = (err as { response?: { data?: ApiError } })?.response?.data
      const code = apiError?.errorCode
      setError(
        code && errorMessages[code]
          ? code
          : `__RAW__${apiError?.message ?? 'Verification failed. Please try again.'}`,
      )
      // Clear the still-pending codes so the user retypes fresh.
      if (!smsVerified) setSmsOtp('')
      if (emailChannel && !emailVerified) setEmailOtp('')
    } finally {
      setLoading(false)
      submittedRef.current = false
    }
  }, [profileId, smsOtp, emailOtp, emailChannel, emailVerified, smsVerified, navigate, testBypass])

  // Auto-submit once the still-pending codes are complete.
  useEffect(() => {
    if (!profileId || loading) return
    const smsReady = smsVerified || OTP_RE.test(smsOtp)
    const emailReady = !emailChannel || emailVerified || OTP_RE.test(emailOtp)
    if (smsReady && emailReady) void submit()
  }, [smsOtp, emailOtp, emailChannel, smsVerified, emailVerified, loading, submit, profileId])

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault()
    if (!lookupIdentifier.trim()) return
    setLookupLoading(true)
    setError(null)
    try {
      const response = await authApi.getPendingVerification({ identifier: lookupIdentifier.trim() })
      setProfileId(response.data.profileId)
      setOtpChannels(response.data.otpChannels ?? ['SMS'])
      setLookupNeeded(false)
    } catch (err: unknown) {
      const apiError = (err as { response?: { data?: ApiError } })?.response?.data
      setError(`__RAW__${apiError?.message ?? 'We could not find a pending verification for that account.'}`)
    } finally {
      setLookupLoading(false)
    }
  }

  const handleResend = useCallback(
    async (channel: Channel) => {
      if (!profileId) return
      const current = channel === 'SMS' ? smsResend : emailResend
      if (current.cooldown > 0 || current.count >= MAX_RESENDS) return

      const setResend = channel === 'SMS' ? setSmsResend : setEmailResend
      // Optimistically apply cooldown + count, and clear that channel's code.
      setResend((prev) => ({ count: prev.count + 1, cooldown: RESEND_COOLDOWN }))
      if (channel === 'SMS') setSmsOtp(testBypass)
      else setEmailOtp(testBypass)
      setError(null)

      try {
        await authApi.resendOtp({ profileId, channel })
      } catch (err: unknown) {
        const apiError = (err as { response?: { data?: ApiError } })?.response?.data
        setError(`__RAW__${apiError?.message ?? `We could not resend the ${channel} code. Please try again.`}`)
      }
    },
    [profileId, smsResend, emailResend, testBypass],
  )

  function bannerText(b: string): string {
    if (b.startsWith('__RAW__')) return b.slice('__RAW__'.length)
    return errorMessages[b] ?? 'Verification failed. Please try again.'
  }

  /** Per-channel resend control: countdown → "Resend" → "no resends left". */
  function renderResend(channel: Channel, resend: ResendState) {
    if (resend.count >= MAX_RESENDS) {
      return (
        <p className="text-center text-xs text-muted-foreground">
          You have used all resend attempts for {channel === 'SMS' ? 'SMS' : 'email'}.
        </p>
      )
    }
    if (resend.cooldown > 0) {
      return (
        <p className="text-center text-xs text-muted-foreground">
          Resend {channel === 'SMS' ? 'SMS' : 'email'} code in {resend.cooldown}s
        </p>
      )
    }
    return (
      <div className="text-center">
        <button
          type="button"
          onClick={() => void handleResend(channel)}
          className="text-xs font-medium text-primary hover:underline"
        >
          Resend {channel === 'SMS' ? 'SMS' : 'email'} code ({MAX_RESENDS - resend.count} left)
        </button>
      </div>
    )
  }

  const canSubmit =
    !!profileId &&
    (smsVerified || OTP_RE.test(smsOtp)) &&
    (!emailChannel || emailVerified || OTP_RE.test(emailOtp))

  return (
    <AuthShell
      title="Verify your account"
      subtitle={
        emailChannel
          ? 'Enter the codes we sent to your mobile and email to confirm it is really you.'
          : 'Enter the code we sent to your mobile to confirm it is really you.'
      }
      footer={
        <>
          Entered the wrong details?{' '}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Go back
          </Link>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3.5 text-sm text-destructive"
          >
            <Icon name="alert-circle" size={16} className="mt-0.5 shrink-0" />
            <span>{bannerText(error)}</span>
          </div>
        )}

        {partial && (
          <div
            role="status"
            className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3.5 text-sm text-foreground"
          >
            <Icon name="alert-circle" size={16} className="mt-0.5 shrink-0 text-warning" />
            <span>{partial}</span>
          </div>
        )}

        {lookupNeeded ? (
          <form onSubmit={handleLookup} className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Enter your mobile number or email to receive your verification code.
            </p>
            <input
              inputMode="text"
              autoComplete="username"
              placeholder="Mobile number or email"
              value={lookupIdentifier}
              onChange={(e) => setLookupIdentifier(e.target.value)}
              className="min-h-11 w-full rounded-lg border border-input bg-card px-3.5 text-foreground shadow-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40"
            />
            <Button type="submit" size="lg" loading={lookupLoading} className="w-full">
              Continue
            </Button>
          </form>
        ) : (
          <>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Icon name="phone" size={16} className="text-primary" />
                SMS code
                {smsVerified && (
                  <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-success">
                    <Icon name="circle-check" size={14} />
                    Verified
                  </span>
                )}
              </div>
              <OtpInput
                value={smsOtp}
                onChange={setSmsOtp}
                disabled={loading || smsVerified}
                verified={smsVerified || OTP_RE.test(smsOtp)}
                autoFocus
                ariaLabel="SMS verification code"
              />
              {!smsVerified && renderResend('SMS', smsResend)}
            </div>

            {emailChannel && (
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Icon name="mail" size={16} className="text-primary" />
                  Email code
                  {emailVerified && (
                    <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-success">
                      <Icon name="circle-check" size={14} />
                      Verified
                    </span>
                  )}
                </div>
                <OtpInput
                  value={emailOtp}
                  onChange={setEmailOtp}
                  disabled={loading || emailVerified}
                  verified={emailVerified || OTP_RE.test(emailOtp)}
                  ariaLabel="Email verification code"
                />
                {!emailVerified && renderResend('EMAIL', emailResend)}
              </div>
            )}

            <Button
              type="button"
              size="lg"
              loading={loading}
              disabled={!canSubmit || loading}
              onClick={() => void submit()}
              className="w-full"
            >
              {loading ? 'Verifying…' : 'Verify'}
            </Button>
          </>
        )}
      </div>
    </AuthShell>
  )
}
