import type { AxiosInstance } from 'axios';
import type { ActivitySummary } from '../types/activity.types';

export function createActivityApi(client: AxiosInstance) {
  return {
    /** Current user's interaction counts for the dashboard. */
    getActivitySummary() {
      return client.get<ActivitySummary>('/user/activity-summary');
    },
  };
}
