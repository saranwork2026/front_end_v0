import type { ApiError } from '../types/common.types';

/**
 * Narrows an `unknown` error (as caught from an axios call) into the
 * backend's typed `ApiError` shape, if present.
 *
 * Every page that calls the API independently duplicated this same
 * `(err as { response?: { data?: ApiError } })?.response?.data` narrowing —
 * this centralizes it so error handling stays consistent as the `ApiError`
 * shape evolves (see `ErrorResponse.java` for the backend source of truth).
 */
export function getApiError(error: unknown): ApiError | undefined {
  if (error && typeof error === 'object' && 'response' in error) {
    return (error as { response?: { data?: ApiError } }).response?.data;
  }
  return undefined;
}

/**
 * Resolves a user-facing message for a caught API error.
 *
 * Resolution order:
 * 1. A page-specific override for the error's `errorCode`, if provided via `messagesByCode`.
 * 2. The backend's own `message` (already human-readable for most error codes).
 * 3. `fallback`, if the error has no recognizable shape at all.
 */
export function getApiErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
  messagesByCode?: Record<string, string>
): string {
  const apiError = getApiError(error);
  if (!apiError) return fallback;

  if (apiError.errorCode && messagesByCode?.[apiError.errorCode]) {
    return messagesByCode[apiError.errorCode];
  }

  return apiError.message || fallback;
}
