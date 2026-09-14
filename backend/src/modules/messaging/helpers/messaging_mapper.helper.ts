import type { ConversationStatus } from '../enum/message/message.enum.js';
import type { ConversationSummary } from '../types/conversation/conversation.types.js';
import type { InboxMessage } from '../types/message/message.types.js';
import type {
  AutomationConfig,
  AutomationSummary,
  MessageLogItem,
  MessageTemplateSummary,
  WhatsappAccountSummary,
} from '../types/messaging.types.js';
import { parseTemplateVariables } from './template.helper.js';

export function mapAccount(row: {
  id: string;
  sessionName: string;
  displayPhone: string | null;
  status: string;
  killSwitch: boolean;
  lastError: string | null;
  riskAcceptedAt: Date | null;
  webhookVerifiedAt: Date | null;
  createdAt: Date;
}): WhatsappAccountSummary {
  return {
    id: row.id,
    sessionName: row.sessionName,
    displayPhone: row.displayPhone,
    status: row.status as WhatsappAccountSummary['status'],
    killSwitch: row.killSwitch,
    lastError: row.lastError,
    riskAcceptedAt: row.riskAcceptedAt?.toISOString() ?? null,
    webhookVerifiedAt: row.webhookVerifiedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export function mapTemplate(row: {
  id: string;
  tenantId: string | null;
  key: string;
  category: string;
  language: string;
  providerName: string;
  body: string;
  variables: unknown;
  status: string;
}): MessageTemplateSummary {
  return {
    id: row.id,
    key: row.key,
    category: row.category,
    language: row.language,
    providerName: row.providerName,
    body: row.body,
    variables: parseTemplateVariables(row.variables),
    status: row.status,
    global: row.tenantId == null,
  };
}

export function mapAutomation(row: {
  id: string;
  key: string;
  enabled: boolean;
  config: unknown;
  updatedAt: Date;
}): AutomationSummary {
  return {
    id: row.id,
    key: row.key,
    enabled: row.enabled,
    config: parseAutomationConfig(row.config),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function parseAutomationConfig(raw: unknown): AutomationConfig {
  if (!raw || typeof raw !== 'object') return {};
  const value = raw as Record<string, unknown>;
  return {
    ...(typeof value.sendAtLocalTime === 'string' ? { sendAtLocalTime: value.sendAtLocalTime } : {}),
    ...(typeof value.offsetHours === 'number' ? { offsetHours: value.offsetHours } : {}),
    ...(Array.isArray(value.onlyForStatuses)
      ? { onlyForStatuses: value.onlyForStatuses.filter((s): s is string => typeof s === 'string') }
      : {}),
    ...(typeof value.templateKey === 'string' ? { templateKey: value.templateKey } : {}),
  };
}

export function mapLogItem(row: {
  id: string;
  direction: string;
  type: string;
  status: string;
  errorCode: string | null;
  relatedType: string | null;
  relatedId: string | null;
  createdAt: Date;
  template?: { key: string } | null;
}): MessageLogItem {
  return {
    id: row.id,
    direction: row.direction,
    type: row.type,
    templateKey: row.template?.key ?? null,
    status: row.status,
    result: row.errorCode ?? row.status,
    errorCode: row.errorCode,
    relatedType: row.relatedType,
    relatedId: row.relatedId,
    createdAt: row.createdAt.toISOString(),
  };
}

export function mapConversation(row: {
  id: string;
  patientId: string | null;
  contactPhone: string;
  contactName: string | null;
  status: string;
  assignedTo: string | null;
  lastMessageAt: Date | null;
  unreadCount: number;
  createdAt: Date;
}): ConversationSummary {
  return {
    id: row.id,
    patientId: row.patientId,
    contactPhone: row.contactPhone,
    contactName: row.contactName,
    status: row.status as ConversationStatus,
    assignedToUserId: row.assignedTo,
    lastMessageAt: row.lastMessageAt?.toISOString() ?? null,
    unreadCount: row.unreadCount,
    createdAt: row.createdAt.toISOString(),
  };
}

export function mapInboxMessage(row: {
  id: string;
  conversationId: string;
  direction: string;
  type: string;
  body: string | null;
  mediaKey: string | null;
  status: string;
  sentBy: string | null;
  createdAt: Date;
}): InboxMessage {
  return {
    id: row.id,
    conversationId: row.conversationId,
    direction: row.direction,
    type: row.type,
    body: row.body,
    mediaKey: row.mediaKey,
    status: row.status,
    sentBy: row.sentBy,
    createdAt: row.createdAt.toISOString(),
  };
}
