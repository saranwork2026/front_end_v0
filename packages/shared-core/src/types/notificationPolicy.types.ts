/**
 * Types for the centralized notification policy admin API
 * (backend: /api/v1/admin/notification-policy).
 *
 * The policy is a matrix of notification event types x channels; an admin can
 * enable/disable each channel per event ("specifically") or toggle all channels
 * for an event at once ("all"), and reset an event to its code-defined defaults.
 */

/** The four delivery channels. Mirrors the backend NotificationChannel enum. */
export type NotificationPolicyChannel = 'IN_APP' | 'PUSH' | 'EMAIL' | 'SMS';

/**
 * Notification event categories used to group user preferences.
 * Mirrors the backend NotificationCategory enum.
 */
export type NotificationCategory =
  | 'ACCOUNT'
  | 'PROFILE'
  | 'INTEREST'
  | 'ACCESS'
  | 'MESSAGING'
  | 'SUBSCRIPTION'
  | 'ANNOUNCEMENT';

/**
 * A notification event type name (backend NotificationEventType enum). Kept as a
 * string rather than a fixed union so new backend events surface in the matrix
 * without a frontend change — the admin UI renders whatever the API returns.
 */
export type NotificationPolicyEventType = string;

/** One cell of the policy matrix: a single (event, channel) pair's state. */
export interface ChannelPolicyView {
  channel: NotificationPolicyChannel;
  /** Whether the channel is enabled for this event. */
  enabled: boolean;
  /** Whether the channel is mandatory (users cannot opt out). */
  mandatory: boolean;
  /** Derived: enabled and not mandatory -> users may opt out. */
  overridable: boolean;
  /** Whether the delivery adapter for this channel is currently available. */
  adapterAvailable: boolean;
  /** True when an admin override row exists (else it's the code default). */
  overridden: boolean;
}

/** One row of the policy matrix: an event type and its per-channel policy. */
export interface EventPolicyView {
  eventType: NotificationPolicyEventType;
  category: NotificationCategory;
  channels: ChannelPolicyView[];
}

/** Body for updating a single (event, channel) pair. */
export interface UpdateChannelPolicyPayload {
  enabled: boolean;
  /** Optional — defaults to false (user-overridable) when omitted. */
  mandatory?: boolean;
}

/** Body for toggling all channels of an event on/off. */
export interface ToggleAllChannelsPayload {
  enabled: boolean;
}
