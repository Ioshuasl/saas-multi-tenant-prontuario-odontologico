export type SendTemplateInput = {
  phoneNumberId: string;
  accessToken: string;
  to: string;
  templateName: string;
  language: string;
  variables: Record<string, string>;
  buttonPayload?: string | null;
  /** Gate RF-E8-14: se true, provider/job exige consentimento. */
  marketing: boolean;
};

export type SendTextInput = {
  phoneNumberId: string;
  accessToken: string;
  to: string;
  body: string;
};

export type SendResult = {
  providerMessageId: string;
};

export type MessagingProvider = {
  sendTemplate(input: SendTemplateInput): Promise<SendResult>;
  sendText(input: SendTextInput): Promise<SendResult>;
};
