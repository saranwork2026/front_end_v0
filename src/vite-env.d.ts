/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_RECAPTCHA_SITE_KEY?: string
  readonly VITE_OTP_TEST_BYPASS_CODE?: string
  readonly VITE_CAPTCHA_DISABLED?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
