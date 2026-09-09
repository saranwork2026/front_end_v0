export interface Wallet {
  balance: number;
}

export interface WalletTransaction {
  transactionId: string | number;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  referenceType: string;
  referenceId: string;
  balanceAfterTransaction: number;
  createdAt: string;
}

export interface WalletTopupRequest {
  amount: number;
  paymentGateway: string;
}

export interface WalletTopupResponse {
  paymentId: string;
  amount: number;
  message: string;
}
