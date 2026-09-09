import type { AxiosInstance } from 'axios';
import type { ReferralSummary } from '../types/referral.types';

export function createReferralApi(client: AxiosInstance) {
  return {
    /** The current member's referral code, share link, and stats. */
    getSummary() {
      return client.get<ReferralSummary>('/user/referrals');
    },
  };
}
