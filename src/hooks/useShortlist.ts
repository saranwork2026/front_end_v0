import { useCallback, useState } from 'react'
import { shortlistApi } from '@/src/lib/api'

/**
 * Tracks which profiles are shortlisted in the current view and toggles them
 * against the real shortlist API (POST/DELETE /user/shortlist/{profileId}).
 * Optimistic: flips local state immediately, rolls back on failure.
 *
 * `initial` seeds the set (e.g. the Shortlist page where every card starts
 * shortlisted). Search/Matches start empty — the backend SearchResult doesn't
 * carry a per-result shortlisted flag, matching the existing app.
 */
export function useShortlist(initial: Iterable<string> = []) {
  const [ids, setIds] = useState<Set<string>>(() => new Set(initial))
  const [pending, setPending] = useState<Set<string>>(() => new Set())

  const isShortlisted = useCallback((profileId: string) => ids.has(profileId), [ids])

  const toggle = useCallback(
    async (profileId: string) => {
      if (pending.has(profileId)) return
      const currentlyIn = ids.has(profileId)
      // optimistic
      setIds((prev) => {
        const next = new Set(prev)
        if (currentlyIn) next.delete(profileId)
        else next.add(profileId)
        return next
      })
      setPending((prev) => new Set(prev).add(profileId))
      try {
        if (currentlyIn) await shortlistApi.removeFromShortlist(profileId)
        else await shortlistApi.addToShortlist(profileId)
      } catch {
        // rollback
        setIds((prev) => {
          const next = new Set(prev)
          if (currentlyIn) next.add(profileId)
          else next.delete(profileId)
          return next
        })
      } finally {
        setPending((prev) => {
          const next = new Set(prev)
          next.delete(profileId)
          return next
        })
      }
    },
    [ids, pending],
  )

  return { isShortlisted, toggle, ids }
}
