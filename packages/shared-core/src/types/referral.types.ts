/** A member's referral dashboard summary (matches backend ReferralSummaryResponse). */
export interface ReferralSummary {
  /** The member's referral code — their public profileId. */
  referralCode: string;
  /** Ready-to-share link that pre-fills the code on the registration page. */
  shareLink: string;
  totalReferred: number;
  totalQualified: number;
  totalRewardEarned: number;
}
