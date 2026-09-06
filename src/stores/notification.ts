import { useStore } from 'zustand'
import { createNotificationStore } from '@matrimony/shared-core'
import type { NotificationStore } from '@matrimony/shared-core'

export const notificationStore = createNotificationStore()

export function useNotificationStore(): NotificationStore
export function useNotificationStore<T>(selector: (state: NotificationStore) => T): T
export function useNotificationStore<T>(
  selector?: (state: NotificationStore) => T,
): T | NotificationStore {
  return useStore(notificationStore, selector as (state: NotificationStore) => T)
}
