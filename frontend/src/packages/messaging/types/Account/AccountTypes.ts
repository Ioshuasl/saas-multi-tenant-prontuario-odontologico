import type { WhatsappAccountStatus } from '@/packages/messaging/enum/Account/WhatsappAccountStatusEnum';

export type WhatsappAccountSummary = {
  id: string;
  sessionName: string;
  displayPhone: string | null;
  status: WhatsappAccountStatus;
  killSwitch: boolean;
  lastError: string | null;
  riskAcceptedAt: string | null;
  webhookVerifiedAt: string | null;
  createdAt: string;
};

export type AccountConnectInput = {
  riskAccepted: true;
};

export type AccountPatchInput = {
  killSwitch: boolean;
};

export type AccountTestInput = {
  to: string;
};

export type WhatsappAccountQr = {
  qr: string | null;
  status: string;
  displayPhone?: string | null;
};
