import { describe, it, expect } from 'vitest';
import { createAuthStore } from '../auth.store';

function loggedInSession() {
  return {
    profileId: 'SM1',
    userId: 'user-1',
    role: 'USER' as const,
    userStatus: 'ACTIVE' as const,
    profileStatus: 'DRAFT' as const,
    profileCompletionPct: 0,
  };
}

describe('createAuthStore', () => {
  it('should start unauthenticated with all fields null', () => {
    const store = createAuthStore();
    const state = store.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.profileId).toBeNull();
    expect(state.profileStatus).toBeNull();
    expect(state.profileCompletionPct).toBeNull();
  });

  it('should populate the full session and mark authenticated on setSession', () => {
    const store = createAuthStore();
    store.getState().setSession(loggedInSession());

    const state = store.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.profileId).toBe('SM1');
    expect(state.profileStatus).toBe('DRAFT');
    expect(state.profileCompletionPct).toBe(0);
  });

  it('should reset every field back to the initial state on clearAuth', () => {
    const store = createAuthStore();
    store.getState().setSession(loggedInSession());
    store.getState().clearAuth();

    const state = store.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.profileId).toBeNull();
    expect(state.profileStatus).toBeNull();
  });

  describe('updateProfileProgress', () => {
    it('should update profileStatus and profileCompletionPct without touching identity fields', () => {
      const store = createAuthStore();
      store.getState().setSession(loggedInSession());

      store.getState().updateProfileProgress({ profileStatus: 'COMPLETED', profileCompletionPct: 85 });

      const state = store.getState();
      expect(state.profileStatus).toBe('COMPLETED');
      expect(state.profileCompletionPct).toBe(85);
      // Regression guard: this action must not clear/reset identity fields —
      // it's a targeted patch, not a full session replace.
      expect(state.profileId).toBe('SM1');
      expect(state.isAuthenticated).toBe(true);
    });

    it('should leave a field unchanged when it is omitted from the patch', () => {
      const store = createAuthStore();
      store.getState().setSession(loggedInSession());

      store.getState().updateProfileProgress({ profileCompletionPct: 50 });

      const state = store.getState();
      expect(state.profileCompletionPct).toBe(50);
      // profileStatus wasn't included in this patch — must stay at whatever
      // setSession left it as, not get wiped to null or undefined.
      expect(state.profileStatus).toBe('DRAFT');
    });

    it('should allow explicitly setting profileStatus to null', () => {
      const store = createAuthStore();
      store.getState().setSession(loggedInSession());

      store.getState().updateProfileProgress({ profileStatus: null });

      expect(store.getState().profileStatus).toBeNull();
    });

    it('should be the mechanism that keeps ProfileStatusGuard in sync after wizard/preferences save (no full re-login needed)', () => {
      // This is the actual regression this action was added to fix: after
      // finishing the wizard or partner preferences, the store previously
      // only had login-time (stale) profileStatus/profileCompletionPct,
      // which caused ProfileStatusGuard to bounce a completed profile back
      // into the wizard. Confirms a follow-up progress update is reflected
      // immediately, with no clearAuth/setSession round-trip required.
      const store = createAuthStore();
      store.getState().setSession({ ...loggedInSession(), profileStatus: 'DRAFT', profileCompletionPct: 20 });

      store.getState().updateProfileProgress({ profileStatus: 'COMPLETED', profileCompletionPct: 100 });

      const state = store.getState();
      expect(state.profileStatus).toBe('COMPLETED');
      expect(state.profileCompletionPct).toBe(100);
    });
  });
});
