import { authApi, authStore } from './api'

/**
 * Logout: best-effort server call to clear HttpOnly cookies, then clear local
 * auth state and navigate to /login. Mirrors the existing app's auth-utils.
 */
export async function logout(): Promise<void> {
  try {
    await authApi.logout()
  } catch {
    // Best-effort — proceed with local cleanup regardless.
  }
  authStore.getState().clearAuth()
  window.location.href = '/login'
}
