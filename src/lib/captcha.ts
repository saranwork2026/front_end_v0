/**
 * Set VITE_CAPTCHA_DISABLED=true to skip rendering the CAPTCHA widget and
 * requiring a token before submit. Mirrors the backend's captcha.disabled
 * flag. Flip both off before real users are active. Mirrors existing lib/captcha.ts.
 */
export function isCaptchaDisabled(): boolean {
  return import.meta.env.VITE_CAPTCHA_DISABLED === 'true'
}

export function getRecaptchaSiteKey(): string {
  return import.meta.env.VITE_RECAPTCHA_SITE_KEY || ''
}
