'use client'

import Link from 'next/link'
import { useState } from 'react'

import { AuthShell } from '@/components/auth/auth-shell'
import { IconInput } from '@/components/auth/icon-input'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { validateWithSchema } from '@/lib/validation'
import { forgotPasswordSchema } from '@matrimony/shared-core'
import { authApi } from '@/src/lib/api'

export function ForgotPasswordView() {
  const [identifier, setIdentifier] = useState('')
  const [error, setError] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // Validate with the shared-core zod schema (mobile number) for parity.
    const parsed = validateWithSchema(forgotPasswordSchema, { identifier: identifier.trim() })
    if (!parsed.success) {
      setError(parsed.errors.identifier)
      return
    }
    setError(undefined)
    setLoading(true)
    // Errors are intentionally swallowed (no account-existence disclosure) —
    // always show the success state. The one exception is the once-per-day
    // reset limit, which we surface so the user understands why no code arrives.
    try {
      await authApi.forgotPassword({ identifier: identifier.trim() })
    } catch (err: unknown) {
      const code = (err as { response?: { data?: { errorCode?: string } } })?.response?.data?.errorCode
      if (code === 'PASSWORD_RESET_TOO_FREQUENT') {
        setError('A password reset was already requested today. Please try again after 24 hours.')
        setLoading(false)
        return
      }
      // Otherwise ignore — privacy: never reveal whether the account exists.
    }
    setLoading(false)
    setSent(true)
  }

  return (
    <AuthShell
      title={sent ? 'Check your messages' : 'Forgot password'}
      subtitle={
        sent
          ? undefined
          : 'Enter your registered mobile number and we will send a reset code.'
      }
      footer={
        <Link href="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      {sent ? (
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-success/10 text-success">
            <Icon name="circle-check" size={28} />
          </span>
          <p className="text-pretty text-sm text-muted-foreground">
            If an account exists for <span className="font-medium text-foreground">{identifier}</span>, a
            reset code is on its way. Enter it on the reset page to choose a new password.
          </p>
          <Link href="/reset-password" className="w-full">
            <Button size="lg" className="w-full">
              Enter reset code
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <IconInput
            label="Mobile number"
            leadingIcon="phone"
            inputMode="numeric"
            placeholder="9876543210"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            error={error}
          />
          <Button type="submit" size="lg" loading={loading} className="mt-1 w-full">
            {loading ? 'Sending…' : 'Send reset code'}
          </Button>
        </form>
      )}
    </AuthShell>
  )
}
