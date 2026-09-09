export type PaymentStatus = 'INITIATED' | 'SUCCESS' | 'FAILED';
export type PaymentType = 'SUBSCRIPTION' | 'WALLET_RECHARGE' | 'CONTACT_UNLOCK';

export interface Payment {
  paymentId: string;
  amount: number;
  status: PaymentStatus;
  paymentGateway: string;
  paymentReferenceType: PaymentType;
  transactionId: string | null;
  paymentDate: string;
}

export interface PaymentInitRequest {
  planId?: number;
  paymentGateway: string;
}

export interface PaymentInitResponse {
  paymentId: string;
  amount: number;
  paymentType: PaymentType;
  message: string;
}

export interface PaymentSuccessRequest {
  paymentId: string;
  transactionId: string;
}

export interface PaymentFailedRequest {
  paymentId: string;
  transactionId: string;
}

export type PaymentMethod = 'CASH' | 'UPI' | 'ONLINE';

export interface ManualPaymentRequest {
  planId: number;
  paymentMethod: PaymentMethod;
  referenceNote: string;
}

export interface ManualPaymentResponse {
  paymentId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  message: string;
}

/**
 * Submits a cash/online payment claim against an existing CONTACT_UNLOCK
 * payment (the direct-pay-for-one-contact path — no subscription quota
 * left). Mirrors ManualPaymentRequest, but references an already-initiated
 * paymentId instead of a planId, since the Payment row is created up front
 * by POST /user/contacts/unlock/{targetProfileId}.
 */
export interface ContactUnlockManualPaymentRequest {
  paymentId: number;
  paymentMethod: PaymentMethod;
  referenceNote: string;
}
