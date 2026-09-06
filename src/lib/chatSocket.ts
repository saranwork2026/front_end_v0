import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import type { Message } from '@matrimony/shared-core'

/**
 * Thin wrapper around a STOMP-over-SockJS client for live chat message
 * delivery, plus the ephemeral real-time signals layered on top: a typing
 * indicator and live "seen" read-receipts (purely relayed over STOMP, no
 * persistence). Mirrors the existing app's apps/web/src/lib/chatSocket.ts.
 *
 * Auth: the backend authenticates the SockJS handshake using the existing
 * HttpOnly access_token cookie (JwtHandshakeInterceptor on the backend) — the
 * browser sends it automatically on the handshake's XHR/upgrade request since
 * it's same-site, so no token needs to be read/attached here.
 *
 * Resilience: if the connection drops or fails, `onDisconnect` fires so the
 * caller can fall back to REST polling; `onConnect` fires (again) on reconnect
 * so the caller can disable polling once live delivery resumes.
 */

/** Typing signal relayed from the conversation partner. */
export interface TypingEvent {
  fromProfileId: string
  typing: boolean
}

/** "Your messages were seen" signal from the conversation partner. */
export interface ReadReceiptEvent {
  byProfileId: string
}

export interface ChatSocketHandlers {
  onMessage: (message: Message) => void
  onTyping?: (event: TypingEvent) => void
  onReadReceipt?: (event: ReadReceiptEvent) => void
  onConnect?: () => void
  onDisconnect?: () => void
}

export interface ChatSocketHandle {
  client: Client
  /** Publish a typing start/stop signal to the given partner profileId. */
  sendTyping: (toProfileId: string, typing: boolean) => void
}

export function connectChatSocket(baseUrl: string, handlers: ChatSocketHandlers): ChatSocketHandle {
  const client = new Client({
    webSocketFactory: () => new SockJS(`${baseUrl}/ws/chat`),
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    onConnect: () => {
      client.subscribe('/user/queue/messages', (frame) => {
        try {
          const message = JSON.parse(frame.body) as Message
          handlers.onMessage(message)
        } catch {
          // Malformed frame — ignore; REST polling fallback picks it up.
        }
      })
      client.subscribe('/user/queue/typing', (frame) => {
        try {
          handlers.onTyping?.(JSON.parse(frame.body) as TypingEvent)
        } catch {
          // Ignore malformed typing frame — purely cosmetic signal.
        }
      })
      client.subscribe('/user/queue/read', (frame) => {
        try {
          handlers.onReadReceipt?.(JSON.parse(frame.body) as ReadReceiptEvent)
        } catch {
          // Ignore malformed receipt frame — isRead from REST fetch is fallback.
        }
      })
      handlers.onConnect?.()
    },
    onDisconnect: () => handlers.onDisconnect?.(),
    onStompError: () => handlers.onDisconnect?.(),
    onWebSocketClose: () => handlers.onDisconnect?.(),
  })

  client.activate()

  return {
    client,
    sendTyping: (toProfileId: string, typing: boolean) => {
      if (!client.connected) return
      client.publish({
        destination: '/app/chat/typing',
        body: JSON.stringify({ toProfileId, typing }),
      })
    },
  }
}

export function disconnectChatSocket(handle: ChatSocketHandle | Client | null): void {
  if (!handle) return
  const client = 'client' in handle ? handle.client : handle
  client.deactivate()
}
