/**
 * Subscription quota display helpers.
 *
 * Backend quota fields use `-1` to mean "unlimited" for that resource (e.g. a
 * PLATINUM plan's chats / photo views). The UI must render that as
 * "Unlimited" with a full bar rather than a nonsensical "-1 / -1", and cap the
 * remaining/total percentage into the 0–100 range for the progress bar.
 *
 * This is pure/UI-framework-agnostic so it can be unit-tested (and reused by
 * web and future mobile) without a DOM.
 */

export interface QuotaDisplay {
  /** True when the quota is unlimited (total or remaining is negative). */
  unlimited: boolean;
  /** Progress-bar fill percentage, 0–100. Unlimited renders as a full bar. */
  percent: number;
}

/**
 * Compute how a single quota row should be displayed.
 *
 * @param remaining remaining count (may be `-1` for unlimited)
 * @param total     total/limit count (may be `-1` for unlimited)
 */
export function describeQuota(remaining: number, total: number): QuotaDisplay {
  const unlimited = total < 0 || remaining < 0;
  if (unlimited) {
    return { unlimited: true, percent: 100 };
  }
  if (total <= 0) {
    return { unlimited: false, percent: 0 };
  }
  const raw = Math.round((remaining / total) * 100);
  const percent = Math.min(100, Math.max(0, raw));
  return { unlimited: false, percent };
}
