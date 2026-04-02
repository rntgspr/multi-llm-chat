import type { ChatEvent, RoomId } from '@multi-llm/types'

type EventHandler = (event: ChatEvent) => void
type RoomEventHandler = (event: ChatEvent) => void

/**
 * Pub/sub message bus for chat events.
 * Allows different parts of the system to communicate without direct coupling.
 */
export class MessageBus {
  private handlers: EventHandler[] = []
  private roomHandlers = new Map<RoomId, RoomEventHandler[]>()

  /**
   * Publishes an event to all subscribers
   */
  publish(event: ChatEvent): void {
    // Notify global handlers
    this.handlers.forEach((handler) => {
      try {
        handler(event)
      } catch (error) {
        console.error('[MessageBus] Handler error:', error)
      }
    })

    // Notify room-specific handlers
    const roomId = 'roomId' in event ? event.roomId : null
    if (roomId) {
      const roomHandlers = this.roomHandlers.get(roomId) || []
      roomHandlers.forEach((handler) => {
        try {
          handler(event)
        } catch (error) {
          console.error('[MessageBus] Room handler error:', error)
        }
      })
    }
  }

  /**
   * Subscribes to all events
   * @returns Unsubscribe function
   */
  subscribe(handler: EventHandler): () => void {
    this.handlers.push(handler)
    return () => {
      this.handlers = this.handlers.filter((h) => h !== handler)
    }
  }

  /**
   * Subscribes to events for a specific room
   * @returns Unsubscribe function
   */
  subscribeToRoom(roomId: RoomId, handler: RoomEventHandler): () => void {
    if (!this.roomHandlers.has(roomId)) {
      this.roomHandlers.set(roomId, [])
    }
    this.roomHandlers.get(roomId)!.push(handler)

    return () => {
      const handlers = this.roomHandlers.get(roomId)
      if (handlers) {
        this.roomHandlers.set(
          roomId,
          handlers.filter((h) => h !== handler)
        )
      }
    }
  }

  /**
   * Clears all handlers for a room
   */
  clearRoom(roomId: RoomId): void {
    this.roomHandlers.delete(roomId)
  }

  /**
   * Clears all handlers
   */
  clearAll(): void {
    this.handlers = []
    this.roomHandlers.clear()
  }
}

// Singleton instance
export const messageBus = new MessageBus()
