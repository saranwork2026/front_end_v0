import { describe, it, expect } from 'vitest';
import { createSubscriptionStore, type ActivePlan } from '../subscription.store';

function goldPlan(): ActivePlan {
  return {
    name: 'GOLD',
    expiryDate: '2026-12-31T00:00:00Z',
    remainingContactViews: 50,
    remainingMessages: 100,
    remainingInterests: 50,
    chatEnabled: true,
  };
}

describe('createSubscriptionStore', () => {
  it('should start with no active plan', () => {
    const store = createSubscriptionStore();
    expect(store.getState().activePlan).toBeNull();
  });

  it('should set the active plan on setActivePlan', () => {
    const store = createSubscriptionStore();
    store.getState().setActivePlan(goldPlan());

    const plan = store.getState().activePlan;
    expect(plan).not.toBeNull();
    expect(plan?.name).toBe('GOLD');
    expect(plan?.chatEnabled).toBe(true);
  });

  it('should clear the active plan on clearPlan', () => {
    const store = createSubscriptionStore();
    store.getState().setActivePlan(goldPlan());
    store.getState().clearPlan();
    expect(store.getState().activePlan).toBeNull();
  });
});
