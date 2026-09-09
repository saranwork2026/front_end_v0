import { createStore } from 'zustand/vanilla';

export interface NotificationState {
  unreadCount: number;
  pollingInterval: number;
}

export interface NotificationActions {
  setUnreadCount: (count: number) => void;
  setPollingInterval: (interval: number) => void;
}

export type NotificationStore = NotificationState & NotificationActions;

const initialState: NotificationState = {
  unreadCount: 0,
  pollingInterval: 60_000,
};

export const createNotificationStore = () =>
  createStore<NotificationStore>((set) => ({
    ...initialState,

    setUnreadCount: (count) => set({ unreadCount: count }),

    setPollingInterval: (interval) => set({ pollingInterval: interval }),
  }));
