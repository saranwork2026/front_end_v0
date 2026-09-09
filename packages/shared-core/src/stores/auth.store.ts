import { createStore } from 'zustand/vanilla';
import type { ProfileStatus, UserRole, UserStatus } from '../types/common.types';

export interface AuthState {
  profileId: string | null;
  userId: string | null;
  role: UserRole | null;
  userStatus: UserStatus | null;
  profileStatus: ProfileStatus | null;
  profileCompletionPct: number | null;
  isAuthenticated: boolean;
}

export interface SessionInfo {
  profileId: string;
  userId: string;
  role: UserRole;
  userStatus?: UserStatus;
  profileStatus?: ProfileStatus | null;
  profileCompletionPct?: number;
}

export interface AuthActions {
  setSession: (session: SessionInfo) => void;
  /**
   * Patches just the profile-progress fields (profileStatus,
   * profileCompletionPct) without touching the rest of the session.
   * Needed because these two fields are set once at login and otherwise go
   * stale as the user progresses through the profile wizard / partner
   * preferences — ProfileStatusGuard reads them on every navigation, so
   * without this a just-completed profile still looks "incomplete" to the
   * guard until the next full login/refresh, bouncing the user back into
   * the wizard instead of letting them through.
   */
  updateProfileProgress: (progress: { profileStatus?: ProfileStatus | null; profileCompletionPct?: number }) => void;
  clearAuth: () => void;
}

export type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  profileId: null,
  userId: null,
  role: null,
  userStatus: null,
  profileStatus: null,
  profileCompletionPct: null,
  isAuthenticated: false,
};

export const createAuthStore = () =>
  createStore<AuthStore>((set) => ({
    ...initialState,

    setSession: ({ profileId, userId, role, userStatus, profileStatus, profileCompletionPct }) =>
      set({
        profileId,
        userId,
        role,
        userStatus: userStatus ?? null,
        profileStatus: profileStatus ?? null,
        profileCompletionPct: profileCompletionPct ?? null,
        isAuthenticated: true,
      }),

    updateProfileProgress: (progress) =>
      set((state) => ({
        profileStatus: progress.profileStatus !== undefined ? progress.profileStatus : state.profileStatus,
        profileCompletionPct: progress.profileCompletionPct !== undefined ? progress.profileCompletionPct : state.profileCompletionPct,
      })),

    clearAuth: () => set(initialState),
  }));
