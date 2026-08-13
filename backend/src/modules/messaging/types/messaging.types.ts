import type { AutomationKey } from '../enum/automation/automation.enum.js';
import type { TemplateCategory, TemplateKey } from '../enum/template/template.enum.js';
import type { WhatsappAccountStatus } from '../enum/whatsapp_account/whatsapp_account.enum.js';

export type WhatsappAccountSummary = {
  id: string;
  wabaId: string;
  phoneNumberId: string;
  displayPhone: string;
  status: WhatsappAccountStatus;
  killSwitch: boolean;
  lastError: string | null;
  webhookVerifiedAt: string | null;
  createdAt: string;
};

export type MessageTemplateSummary = {
  id: string;
  key: string;
  category: TemplateCategory | string;
  language: string;
  providerName: string;
  body: string;
  variables: string[];
  status: string;
  global: boolean;
};

export type AutomationConfig = {
  sendAtLocalTime?: string;
  offsetHours?: number;
  onlyForStatuses?: string[];
  templateKey?: TemplateKey | string;
};

export type AutomationSummary = {
  id: string;
  key: AutomationKey | string;
  enabled: boolean;
  config: AutomationConfig;
  updatedAt: string;
};

export type MessagingUsage = {
  courtesyGranted: number;
  balance: number;
  consumed: number;
  lowThreshold: number;
  creditsLow: boolean;
  creditsExhausted: boolean;
};

export type MessageLogItem = {
  id: string;
  direction: string;
  type: string;
  templateKey: string | null;
  status: string;
  result: string | null;
  errorCode: string | null;
  relatedType: string | null;
  relatedId: string | null;
  createdAt: string;
};

export type MessageLogList = {
  items: MessageLogItem[];
  nextCursor: string | null;
};
