// Real API integration layer for New-FE — mirrors the existing app's
// apps/web/src/lib/api.ts. Cookie-only auth (HttpOnly cookies set by the
// backend); the axios client sends credentials and silently refreshes on 401.
//
// NOTE: this lives at src/lib/api.ts. The v0 mock data files at the project
// root `lib/*-data.ts` are being replaced view-by-view with calls into these
// real API instances.
import {
  createApiClient,
  createAuthStore,
  createAuthApi,
  createProfileApi,
  createSearchApi,
  createInterestsApi,
  createAccessApi,
  createContactsApi,
  createChatApi,
  createPaymentsApi,
  createWalletApi,
  createReferralApi,
  createPublicProfileApi,
  createNotificationsApi,
  createAdminApi,
  createPlansApi,
  createShortlistApi,
  createBlockApi,
  createProfileViewsApi,
  createReportApi,
  createAccountApi,
  createPhotoApi,
  createSuccessStoryApi,
  createVerificationApi,
} from '@matrimony/shared-core'

// Singleton auth store for the web app.
export const authStore = createAuthStore()

// In dev we call a same-origin '/api/v1' path that Vite proxies to the
// production API (see vite.config.ts) to sidestep CORS preflight from
// localhost. In production the built app uses the absolute VITE_API_BASE_URL.
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1'
const baseURL = import.meta.env.DEV ? '/api/v1' : rawBaseUrl

const apiClient = createApiClient({
  baseURL,
  onAuthFailure: () => {
    authStore.getState().clearAuth()
    // Preserve where the user was so login can send them back.
    if (window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
  },
})

export { apiClient }

// Dev-only: expose the auth store on window so the authenticated shell can be
// exercised locally without a production login. Never included in prod builds.
if (import.meta.env.DEV) {
  ;(window as unknown as { __authStore?: typeof authStore }).__authStore = authStore
}

// Domain API instances (same set as the existing app).
export const authApi = createAuthApi(apiClient)
export const profileApi = createProfileApi(apiClient)
export const searchApi = createSearchApi(apiClient)
export const interestsApi = createInterestsApi(apiClient)
export const accessApi = createAccessApi(apiClient)
export const contactsApi = createContactsApi(apiClient)
export const chatApi = createChatApi(apiClient)
export const paymentsApi = createPaymentsApi(apiClient)
export const walletApi = createWalletApi(apiClient)
export const referralApi = createReferralApi(apiClient)
export const publicProfileApi = createPublicProfileApi(apiClient)
export const notificationsApi = createNotificationsApi(apiClient)
export const adminApi = createAdminApi(apiClient)
export const plansApi = createPlansApi(apiClient)
export const shortlistApi = createShortlistApi(apiClient)
export const blockApi = createBlockApi(apiClient)
export const profileViewsApi = createProfileViewsApi(apiClient)
export const reportApi = createReportApi(apiClient)
export const accountApi = createAccountApi(apiClient)
export const photoApi = createPhotoApi(apiClient)
export const successStoryApi = createSuccessStoryApi(apiClient)
export const verificationApi = createVerificationApi(apiClient)
