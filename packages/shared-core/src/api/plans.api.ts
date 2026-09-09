import type { AxiosInstance } from 'axios';
import type { SubscriptionPlan } from '../types/plans.types';

export function createPlansApi(client: AxiosInstance) {
  return {
    getActivePlans() {
      return client.get<SubscriptionPlan[]>('/pub/plans/active');
    },
  };
}
