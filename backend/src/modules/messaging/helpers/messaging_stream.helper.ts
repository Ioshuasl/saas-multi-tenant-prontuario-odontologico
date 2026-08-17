import { EventEmitter } from 'node:events';

export type MessagingStreamEventName =
  | 'message_received'
  | 'message_sent'
  | 'conversation_updated';

export type MessagingStreamEvent = {
  name: MessagingStreamEventName;
  payload: Record<string, unknown>;
};

const emitters = new Map<string, EventEmitter>();

function tenantEmitter(tenantId: string): EventEmitter {
  let emitter = emitters.get(tenantId);
  if (!emitter) {
    emitter = new EventEmitter();
    emitter.setMaxListeners(100);
    emitters.set(tenantId, emitter);
  }
  return emitter;
}

export function publishMessagingStreamEvent(tenantId: string, event: MessagingStreamEvent): void {
  tenantEmitter(tenantId).emit('event', event);
}

export function subscribeMessagingStream(
  tenantId: string,
  listener: (event: MessagingStreamEvent) => void,
): () => void {
  const emitter = tenantEmitter(tenantId);
  emitter.on('event', listener);
  return () => emitter.off('event', listener);
}
