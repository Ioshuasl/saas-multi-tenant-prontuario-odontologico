import { env } from '../../config/env.js';
import type { EmailProvider } from './email.port.js';
import { ResendEmailAdapter } from './resend.adapter.js';
import { SmtpEmailAdapter } from './smtp.adapter.js';

let singleton: EmailProvider | undefined;

/** Mailpit (SMTP) em local; Resend só em production com API key (ADR-0009). */
export function getEmailProvider(): EmailProvider {
  if (!singleton) {
    if (env.NODE_ENV === 'production' && env.RESEND_API_KEY) {
      singleton = new ResendEmailAdapter(env.RESEND_API_KEY);
    } else {
      singleton = new SmtpEmailAdapter();
    }
  }
  return singleton;
}

export type { EmailMessage, EmailProvider } from './email.port.js';
