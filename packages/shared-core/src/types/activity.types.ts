/** Dashboard activity summary (GET /user/activity-summary). */
export interface ActivitySummary {
  interestsSent: number;
  interestsReceivedPending: number;
  shortlistCount: number;
  profileViewsReceived: number;
  profileViewsMade: number;
}
