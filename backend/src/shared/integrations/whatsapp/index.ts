import { env } from '../../config/env.js';
import type { MessagingProvider } from '../../../modules/messaging/types/ports/messaging_provider.port.js';
import { FakeMessagingProvider } from './fake.adapter.js';
import { WhatsAppCloudProvider } from './cloud.adapter.js';

let singleton: MessagingProvider | undefined;

/** Fake em test/dev; Cloud em production (ADR-0005). */
export function getMessagingProvider(): MessagingProvider {
  if (!singleton) {
    singleton =
      env.NODE_ENV === 'production' ? new WhatsAppCloudProvider() : new FakeMessagingProvider();
  }
  return singleton;
}

export function setMessagingProvider(provider: MessagingProvider | undefined): void {
  singleton = provider;
}

export type { MessagingProvider } from '../../../modules/messaging/types/ports/messaging_provider.port.js';
export { FakeMessagingProvider } from './fake.adapter.js';
export { WhatsAppCloudProvider } from './cloud.adapter.js';
