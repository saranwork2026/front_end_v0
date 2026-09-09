export interface UnlockContactResponse {
  alreadyUnlocked: boolean;
  unlockedDirectly: boolean;
  mobileNo: string | null;
  email: string | null;
  paymentId: number | null;
  amount: number | null;
  message: string;
}

export interface UnlockedContact {
  profileId: string;
  firstName: string;
  lastName: string | null;
  mobileNo: string;
  email: string | null;
  amountCharged: number;
  paymentSource: 'SUBSCRIPTION' | 'PAYMENT';
  unlockedAt: string;
}
