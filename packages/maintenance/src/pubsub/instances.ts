/**
 * Pub/Sub Singleton Instances
 * Provides shared publisher and subscriber instances
 */

import { RedisPubSubPublisher } from "./publisher.js";
import { RedisPubSubSubscriber } from "./subscriber.js";

/**
 * Singleton publisher instance
 */
let publisherInstance: RedisPubSubPublisher | null = null;

/**
 * Singleton subscriber instance
 */
let subscriberInstance: RedisPubSubSubscriber | null = null;

/**
 * Get the singleton publisher instance
 * @param producer - Service identifier (web/api/worker)
 * @returns Shared publisher instance
 */
export function getPublisher(
  producer: "web" | "api" | "worker" = "web",
): RedisPubSubPublisher {
  if (!publisherInstance) {
    publisherInstance = new RedisPubSubPublisher(producer);
    console.log(`[PubSub] Publisher singleton created (producer: ${producer})`);
  }

  return publisherInstance;
}

/**
 * Get the singleton subscriber instance
 * @returns Shared subscriber instance
 */
export function getSubscriber(): RedisPubSubSubscriber {
  if (!subscriberInstance) {
    subscriberInstance = new RedisPubSubSubscriber();
    console.log("[PubSub] Subscriber singleton created");
  }

  return subscriberInstance;
}

/**
 * Export default instances for convenience
 */
export const publisher = getPublisher();
export const subscriber = getSubscriber();
