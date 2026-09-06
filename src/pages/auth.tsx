import { useSearchParams } from 'react-router-dom'

import { useParams } from 'react-router-dom'

import { useDocumentTitle } from '@/src/hooks/use-document-title'
import { LoginView } from '@/components/auth/login-view'
import { RegisterView } from '@/components/auth/register-view'
import { VerifyOtpView } from '@/components/auth/verify-otp-view'
import { ForgotPasswordView } from '@/components/auth/forgot-password-view'
import { ResetPasswordView } from '@/components/auth/reset-password-view'
import { ChangePasswordView } from '@/components/auth/change-password-view'
import { LegalView } from '@/components/legal/legal-view'
import { PublicProfileView } from '@/components/public/public-profile-view'

export function PublicProfilePage() {
  useDocumentTitle('Profile | Matrimony')
  const { profileId = '' } = useParams()
  return <PublicProfileView profileId={profileId} />
}

export function TermsPage() {
  useDocumentTitle('Terms of Service | Matrimony')
  return <LegalView doc="terms" />
}

export function PrivacyPolicyPage() {
  useDocumentTitle('Privacy Policy | Matrimony')
  return <LegalView doc="privacy" />
}

export function LoginPage() {
  useDocumentTitle('Sign in | Matrimony')
  return <LoginView />
}

export function RegisterPage() {
  useDocumentTitle('Create account | Matrimony')
  // RegisterView reads ?ref= internally for the referral code.
  return <RegisterView />
}

export function VerifyOtpPage() {
  useDocumentTitle('Verify OTP | Matrimony')
  return <VerifyOtpView />
}

export function ForgotPasswordPage() {
  useDocumentTitle('Forgot password | Matrimony')
  return <ForgotPasswordView />
}

export function ResetPasswordPage() {
  useDocumentTitle('Reset password | Matrimony')
  const [params] = useSearchParams()
  const profileId = params.get('profileId') ?? ''
  return <ResetPasswordView profileId={profileId} />
}

export function ChangePasswordPage() {
  useDocumentTitle('Change password | Matrimony')
  const [params] = useSearchParams()
  const forced = params.get('forced') === '1'
  return <ChangePasswordView forced={forced} />
}
