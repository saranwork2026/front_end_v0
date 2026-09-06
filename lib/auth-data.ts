// Auth business rules + option lists + simulated API layer.
// Rules come straight from the spec:
//   mobile  ^[6-9]\d{9}$
//   password ≥8 with upper/lower/digit/special
//   OTP      6 digits
// The API functions here stand in for authApi.* — they only simulate latency
// and deterministic error paths so the screens can exercise every state.

export const MOBILE_RE = /^[6-9]\d{9}$/
export const OTP_RE = /^\d{6}$/

export interface PasswordChecks {
  length: boolean
  upper: boolean
  lower: boolean
  digit: boolean
  special: boolean
}

export function checkPassword(value: string): PasswordChecks {
  return {
    length: value.length >= 8,
    upper: /[A-Z]/.test(value),
    lower: /[a-z]/.test(value),
    digit: /\d/.test(value),
    special: /[^A-Za-z0-9]/.test(value),
  }
}

export function isPasswordValid(value: string): boolean {
  const c = checkPassword(value)
  return c.length && c.upper && c.lower && c.digit && c.special
}

export const passwordRules: { key: keyof PasswordChecks; label: string }[] = [
  { key: 'length', label: 'At least 8 characters' },
  { key: 'upper', label: 'One uppercase letter' },
  { key: 'lower', label: 'One lowercase letter' },
  { key: 'digit', label: 'One number' },
  { key: 'special', label: 'One special character' },
]

// Backend error codes mapped to human banners (spec §"maps ...").
export const authErrorMessages: Record<string, string> = {
  INVALID_CREDENTIALS: 'The mobile number / email or password is incorrect.',
  USER_OTP_PENDING: 'Your account is not verified yet. Please verify the OTP to continue.',
  USER_BLOCKED: 'This account has been blocked. Please contact support for help.',
  ACCOUNT_LOCKED: 'Too many attempts. Your account is temporarily locked — try again later.',
  USER_ALREADY_EXISTS: 'An account with this mobile number or email already exists.',
  CAPTCHA_VERIFICATION_FAILED: 'Captcha verification failed. Please try again.',
  INVALID_OTP: 'The code you entered is incorrect. Please check and try again.',
  OTP_EXPIRED: 'This code has expired. Please request a new one.',
  OTP_ATTEMPTS_EXCEEDED: 'Too many incorrect attempts. Please request a new code.',
  RATE_LIMITED: 'Too many requests. Please wait a moment and try again.',
}

export interface AuthResult {
  ok: boolean
  code?: string
  // Login-only: drives the priority redirect.
  redirectTo?: string
  // Register-only: where to go on success.
  next?: string
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

// Deterministic demo triggers so reviewers can reach each state without a backend.
// Any identifier containing these tokens forces the matching error.
function forcedCode(identifier: string): string | undefined {
  const v = identifier.toLowerCase()
  if (v.includes('blocked')) return 'USER_BLOCKED'
  if (v.includes('locked')) return 'ACCOUNT_LOCKED'
  if (v.includes('pending') || v.includes('unverified')) return 'USER_OTP_PENDING'
  if (v.includes('wrong') || v.includes('bad')) return 'INVALID_CREDENTIALS'
  if (v.includes('exists') || v.includes('taken')) return 'USER_ALREADY_EXISTS'
  return undefined
}

export async function login(identifier: string, _password: string): Promise<AuthResult> {
  await wait(900)
  const code = forcedCode(identifier)
  if (code) return { ok: false, code }
  // Priority redirect demo: an "admin" identifier lands on /admin, else dashboard.
  const redirectTo = identifier.toLowerCase().includes('admin') ? '/admin' : '/'
  return { ok: true, redirectTo }
}

export async function register(mobileNo: string, email: string): Promise<AuthResult> {
  await wait(1000)
  const code = forcedCode(email) ?? forcedCode(mobileNo)
  if (code) return { ok: false, code }
  // Spec: success → /verify-otp (or /login if no OTP). We always issue OTP here.
  return { ok: true, next: '/verify-otp' }
}

export async function verifyOtp(smsOtp: string): Promise<AuthResult> {
  await wait(900)
  // Demo triggers: 000000 → expired, 111111 → attempts exceeded, else check length.
  if (smsOtp === '000000') return { ok: false, code: 'OTP_EXPIRED' }
  if (smsOtp === '111111') return { ok: false, code: 'OTP_ATTEMPTS_EXCEEDED' }
  if (!OTP_RE.test(smsOtp) || smsOtp === '123456') return { ok: false, code: 'INVALID_OTP' }
  return { ok: true }
}

export async function forgotPassword(_identifier: string): Promise<AuthResult> {
  await wait(800)
  // Spec: errors intentionally swallowed — always success (no account disclosure).
  return { ok: true }
}

export async function resetPassword(otp: string): Promise<AuthResult> {
  await wait(900)
  if (otp === '000000') return { ok: false, code: 'OTP_EXPIRED' }
  if (!OTP_RE.test(otp)) return { ok: false, code: 'INVALID_OTP' }
  return { ok: true }
}

export async function changePassword(current: string): Promise<AuthResult> {
  await wait(900)
  if (current.toLowerCase().includes('wrong')) return { ok: false, code: 'INVALID_CREDENTIALS' }
  return { ok: true }
}
