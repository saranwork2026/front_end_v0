import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { UnlockContactResponse, ApiError } from '@matrimony/shared-core'
import { contactsApi } from '@/src/lib/api'

interface ContactData {
  mobileNo: string | null
  email: string | null
}

/**
 * Contact-unlock business rule (idempotent → quota → payment). Mirrors the
 * existing app's useContactUnlock:
 *  - alreadyUnlocked / unlockedDirectly → returns contact immediately
 *  - paymentId present → navigate to /payments/:id with amount + type state
 */
export function useContactUnlock() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [contact, setContact] = useState<ContactData | null>(null)

  const unlock = useCallback(
    async (profileId: string) => {
      setLoading(true)
      setError(null)
      setContact(null)
      try {
        const response = await contactsApi.unlockContact(profileId)
        const data: UnlockContactResponse = response.data
        if (data.alreadyUnlocked || data.unlockedDirectly) {
          setContact({ mobileNo: data.mobileNo, email: data.email })
        } else if (data.paymentId) {
          navigate(`/payments/${data.paymentId}`, {
            state: { amount: data.amount, paymentType: 'CONTACT_UNLOCK' },
          })
        }
      } catch (err: unknown) {
        const res = (err as { response?: { status?: number; data?: ApiError } })?.response
        setError(res?.status === 400 ? 'Cannot unlock own contact' : res?.data?.message || 'Failed to unlock contact')
      } finally {
        setLoading(false)
      }
    },
    [navigate],
  )

  return { unlock, loading, error, contact }
}
