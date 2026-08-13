export const MESSAGE_DIRECTIONS = ['INBOUND', 'OUTBOUND'] as const;
export type MessageDirection = (typeof MESSAGE_DIRECTIONS)[number];

export const MESSAGE_TYPES = ['TEXT', 'TEMPLATE', 'IMAGE', 'DOCUMENT', 'AUDIO', 'INTERACTIVE'] as const;
export type MessageType = (typeof MESSAGE_TYPES)[number];

export const MESSAGE_STATUSES = ['QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED'] as const;
export type MessageStatus = (typeof MESSAGE_STATUSES)[number];

export const CREDIT_KINDS = ['PURCHASE', 'BONUS', 'CONSUMPTION', 'ADJUSTMENT'] as const;
export type CreditKind = (typeof CREDIT_KINDS)[number];

export const CONVERSATION_STATUSES = ['OPEN', 'PENDING', 'CLOSED'] as const;
export type ConversationStatus = (typeof CONVERSATION_STATUSES)[number];
