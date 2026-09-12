export interface Conversation {
  otherProfileId: string;
  otherFirstName: string;
  otherLastName: string | null;
  otherPrimaryPhotoUrl: string | null;
  /** DP crop focal point (object-position %, 0–100); null → center. */
  otherPhotoFocalX?: number | null;
  otherPhotoFocalY?: number | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  isBlocked: boolean;
}

export interface Message {
  messageId: number;
  senderProfileId: string;
  content: string;
  sentAt: string;
  /**
   * Whether the recipient has read this message. Present on messages fetched
   * from the server; may be undefined on an optimistically-appended message
   * the current user just sent (treated as unread/"Sent" until confirmed).
   */
  isRead?: boolean;
}

export interface SendMessageRequest {
  toProfileId: string;
  content: string;
}

export interface SendMessageResponse {
  messageId: number;
  sentAt: string;
}
