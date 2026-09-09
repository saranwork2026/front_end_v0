import { createStore } from 'zustand/vanilla'
import { useStore } from 'zustand'

/**
 * Landing-decision signals that the backend returns on login / refresh-token
 * but that the shared-core AuthStore doesn't carry (shared-core is a read-only
 * dependency here). Kept in a small separate in-memory store so ProfileStatusGuard
 * can decide the post-login step (preferences -> plans -> matches).
 *
 * These are set from the LoginResponse at login and from the refresh-token
 * response on app bootstrap, and patched as the user progresses (e.g. after
 * saving preferences or completing a subscription payment).
 */
export interface LandingState {
  hasPartnerPreferences: boolean | null
  hasActiveSubscription: boolean | null
  setLandingSignals: (signals: {
    hasPartnerPreferences?: boolean
    hasActiveSubscription?: boolean
  }) => void
  clearLanding: () => void
}

export const landingStore = createStore<LandingState>((set) => ({
  hasPartnerPreferences: null,
  hasActiveSubscription: null,
  setLandingSignals: (signals) =>
    set((s) => ({
      hasPartnerPreferences: signals.hasPartnerPreferences ?? s.hasPartnerPreferences,
      hasActiveSubscription: signals.hasActiveSubscription ?? s.hasActiveSubscription,
    })),
  clearLanding: () => set({ hasPartnerPreferences: null, hasActiveSubscription: null }),
}))

export function useLandingStore(): LandingState
export function useLandingStore<T>(selector: (state: LandingState) => T): T
export function useLandingStore<T>(selector?: (state: LandingState) => T): T | LandingState {
  return useStore(landingStore, selector as (state: LandingState) => T)
}

/* ------------------------------------------------------------------ */
/* Per-device "remind me later" for the subscription/plans onboarding  */
/* step (item 6). Persisted in localStorage so it survives reloads on   */
/* this device but is intentionally not synced across devices.          */
/* ------------------------------------------------------------------ */

const REMIND_LATER_KEY = 'subscription_remind_later'

export function isSubscriptionRemindLater(): boolean {
  try {
    return localStorage.getItem(REMIND_LATER_KEY) === '1'
  } catch {
    return false
  }
}

export function setSubscriptionRemindLater(): void {
  try {
    localStorage.setItem(REMIND_LATER_KEY, '1')
  } catch {
    /* localStorage unavailable (private mode) — non-fatal, just won't persist. */
  }
}

export function clearSubscriptionRemindLater(): void {
  try {
    localStorage.removeItem(REMIND_LATER_KEY)
  } catch {
    /* no-op */
  }
}
