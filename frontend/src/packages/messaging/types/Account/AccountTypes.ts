import type { WhatsappAccountStatus } from '@/packages/messaging/enum/Account/WhatsappAccountStatusEnum';

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

export type AccountConnectInput = {
  wabaId: string;
  phoneNumberId: string;
  displayPhone: string;
  accessToken: string;
};

export type AccountPatchInput = {
  killSwitch: boolean;
};
