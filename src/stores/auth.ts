import { useStore } from 'zustand'
import type { AuthStore } from '@matrimony/shared-core'
import { authStore } from '../lib/api'

// Re-export the singleton store from lib/api (single source of truth).
export { authStore }

export function useAuthStore(): AuthStore
export function useAuthStore<T>(selector: (state: AuthStore) => T): T
export function useAuthStore<T>(selector?: (state: AuthStore) => T): T | AuthStore {
  return useStore(authStore, selector as (state: AuthStore) => T)
}
