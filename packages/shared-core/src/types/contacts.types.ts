export interface UnlockContactResponse {
  alreadyUnlocked: boolean;
  unlockedDirectly: boolean;
  mobileNo: string | null;
  email: string | null;
  paymentId: number | null;
  amount: number | null;
  message: string;
}

// Matches the backend ContactUnlockResponse JSON exactly (fields are prefixed
// with "target" because they describe the unlocked target member). Previously
// this type used bare names (profileId/mobileNo/email) that did not match the
// API, so the Contacts page and profile contact-reveal read undefined values.
export interface UnlockedContact {
  unlockId: number;
  targetUserId: string;
  targetProfileId: string;
  targetFirstName: string | null;
  targetLastName: string | null;
  targetMobileNo: string;
  targetEmail: string | null;
  amountCharged: number;
  paymentSource: 'SUBSCRIPTION' | 'PAYMENT';
  unlockedAt: string;
}