/**
 * Event Subscriber Example
 * Demonstrates how to subscribe to events using Redis Pub/Sub
 */

import { getSubscriber } from "@multi-llm/maintenance";
import type {
  MessageSentPayload,
  UserStatusChangedPayload,
  PubSubEnvelope,
} from "@multi-llm/maintenance";

/**
 * Example: Subscribe to chat message sent events
 */
export async function subscribeToMessageSent(): Promise<() => void> {
  const subscriber = getSubscriber();

  const unsubscribe = await subscriber.subscribe<MessageSentPayload>(
    "chat.message.sent",
    (message: PubSubEnvelope<MessageSentPayload>) => {
      console.log(
        `[API] Received message.sent event: ${message.payload.messageId}`,
      );
      console.log(`  Room: ${message.payload.roomId}`);
      console.log(`  User: ${message.payload.userId}`);
      console.log(`  Content: ${message.payload.content}`);

      // Handle the event (e.g., update database, notify WebSocket clients, etc.)
      handleMessageSent(message.payload);
    },
  );

  console.log("[API] Subscribed to chat.message.sent");

  return unsubscribe;
}

/**
 * Example: Subscribe to user status changed events
 */
export async function subscribeToUserStatusChanged(): Promise<() => void> {
  const subscriber = getSubscriber();

  const unsubscribe = await subscriber.subscribe<UserStatusChangedPayload>(
    "user.status.changed",
    async (message: PubSubEnvelope<UserStatusChangedPayload>) => {
      console.log(
        `[API] User ${message.payload.userId} status: ${message.payload.status}`,
      );

      // Handle the event asynchronously
      await handleUserStatusChanged(message.payload);
    },
  );

  console.log("[API] Subscribed to user.status.changed");

  return unsubscribe;
}

/**
 * Example: Subscribe to multiple channels
 */
export async function subscribeToAllEvents(): Promise<() => void> {
  const subscriber = getSubscriber();

  // Subscribe to all chat-related events
  const unsubscribes = await Promise.all([
    subscriber.subscribe("chat.message.sent", handleChatEvent),
    subscriber.subscribe("chat.message.updated", handleChatEvent),
    subscriber.subscribe("chat.message.deleted", handleChatEvent),
    subscriber.subscribe("room.member.joined", handleRoomEvent),
    subscriber.subscribe("room.member.left", handleRoomEvent),
  ]);

  console.log("[API] Subscribed to all chat and room events");

  // Return a function that unsubscribes from all channels
  return async () => {
    for (const unsubscribe of unsubscribes) {
      await unsubscribe();
    }
    console.log("[API] Unsubscribed from all events");
  };
}

/**
 * Handle message sent event
 */
function handleMessageSent(payload: MessageSentPayload): void {
  // Example: Broadcast to WebSocket clients in the room
  // Example: Update message search index
  // Example: Send push notifications
  console.log(`[Handler] Processing message ${payload.messageId}`);
}

/**
 * Handle user status changed event
 */
async function handleUserStatusChanged(
  payload: UserStatusChangedPayload,
): Promise<void> {
  // Example: Update user status in database
  // Example: Notify friends/contacts
  // Example: Update presence indicators
  console.log(`[Handler] User ${payload.userId} is now ${payload.status}`);
}

/**
 * Generic chat event handler
 */
function handleChatEvent(message: PubSubEnvelope<unknown>): void {
  console.log(`[Handler] Chat event: ${message.type} on ${message.channel}`);
}

/**
 * Generic room event handler
 */
function handleRoomEvent(message: PubSubEnvelope<unknown>): void {
  console.log(`[Handler] Room event: ${message.type} on ${message.channel}`);
}
