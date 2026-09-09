import type { AxiosInstance } from 'axios';
import type {
  Wallet,
  WalletTransaction,
  WalletTopupRequest,
  WalletTopupResponse,
} from '../types/wallet.types';

export function createWalletApi(client: AxiosInstance) {
  return {
    getWallet() {
      return client.get<Wallet>('/user/wallet');
    },

    topup(data: WalletTopupRequest) {
      return client.post<WalletTopupResponse>('/payments/wallet/topup', data);
    },

    getTransactions() {
      return client.get<WalletTransaction[]>('/user/wallet/transactions');
    },
  };
}
