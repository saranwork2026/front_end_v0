export interface SubscriptionPlan {
  planId: number;
  name: string;
  description: string;
  price: number;
  validityDays: number;
  contactViewLimit: number;
  messageLimit: number;
  interestLimit: number;
  photoViewLimit: number;
  chatEnabled: boolean;
  profileBoostEnabled: boolean;
  isActive: boolean;
}

export interface PlanCreateRequest {
  name: string;
  description: string;
  price: number;
  validityDays: number;
  contactViewLimit: number;
  messageLimit: number;
  interestLimit: number;
  photoViewLimit: number;
  chatEnabled: boolean;
  profileBoostEnabled: boolean;
}

export interface PlanUpdateRequest {
  name?: string;
  description?: string;
  price?: number;
  validityDays?: number;
  contactViewLimit?: number;
  messageLimit?: number;
  interestLimit?: number;
  photoViewLimit?: number;
  chatEnabled?: boolean;
  profileBoostEnabled?: boolean;
  isActive?: boolean;
}
