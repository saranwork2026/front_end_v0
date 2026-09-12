/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  // Absolute backend origin for the chat WebSocket handshake (e.g.
  // https://api.magizhmatrimony.com). Set in prod because the REST base URL is
  // now a relative same-origin path and can't be used to derive the WS origin.
  readonly VITE_WS_BASE_URL?: string
  readonly VITE_RECAPTCHA_SITE_KEY?: string
  readonly VITE_OTP_TEST_BYPASS_CODE?: string
  readonly VITE_CAPTCHA_DISABLED?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
