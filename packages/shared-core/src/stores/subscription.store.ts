import { createStore } from 'zustand/vanilla';

export interface ActivePlan {
  name: string;
  expiryDate: string;
  remainingContactViews: number;
  remainingMessages: number;
  remainingInterests: number;
  chatEnabled: boolean;
}

export interface SubscriptionState {
  activePlan: ActivePlan | null;
}

export interface SubscriptionActions {
  setActivePlan: (plan: ActivePlan) => void;
  clearPlan: () => void;
}

export type SubscriptionStore = SubscriptionState & SubscriptionActions;

const initialState: SubscriptionState = {
  activePlan: null,
};

export const createSubscriptionStore = () =>
  createStore<SubscriptionStore>((set) => ({
    ...initialState,

    setActivePlan: (plan) => set({ activePlan: plan }),

    clearPlan: () => set({ activePlan: null }),
  }));
