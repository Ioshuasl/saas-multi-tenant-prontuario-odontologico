import { env } from '../../../shared/config/env.js';

export function wahaSessionName(tenantId: string): string {
  if (process.env.NODE_ENV !== 'test' && env.WAHA_SESSION_NAME) return env.WAHA_SESSION_NAME;
  return `t${tenantId.replace(/-/g, '')}`;
}

export function toWahaChatId(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.includes('@')) return phone;
  return `${digits}@c.us`;
}

export function fromWahaChatId(chatId: string): string {
  return chatId.replace(/@c\.us$/i, '').replace(/@s\.whatsapp\.net$/i, '');
}
