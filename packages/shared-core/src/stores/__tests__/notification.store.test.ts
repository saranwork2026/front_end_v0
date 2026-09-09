import { describe, it, expect } from 'vitest';
import { createNotificationStore } from '../notification.store';

describe('createNotificationStore', () => {
  it('should start with zero unread and a 60s polling interval', () => {
    const store = createNotificationStore();
    const state = store.getState();
    expect(state.unreadCount).toBe(0);
    expect(state.pollingInterval).toBe(60_000);
  });

  it('should update the unread count on setUnreadCount', () => {
    const store = createNotificationStore();
    store.getState().setUnreadCount(5);
    expect(store.getState().unreadCount).toBe(5);
  });

  it('should update the polling interval on setPollingInterval', () => {
    const store = createNotificationStore();
    store.getState().setPollingInterval(30_000);
    expect(store.getState().pollingInterval).toBe(30_000);
  });

  it('should keep separate stores isolated', () => {
    const a = createNotificationStore();
    const b = createNotificationStore();
    a.getState().setUnreadCount(9);
    expect(b.getState().unreadCount).toBe(0);
  });
});
