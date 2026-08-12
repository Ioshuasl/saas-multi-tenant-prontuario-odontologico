import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import type { EmailMessage, EmailProvider } from './email.port.js';

const RESEND_API = 'https://api.resend.com/emails';

export class ResendEmailAdapter implements EmailProvider {
  constructor(
    private readonly apiKey: string,
    private readonly from: string = env.MAIL_FROM,
  ) {}

  async send(message: EmailMessage): Promise<void> {
    try {
      const res = await fetch(RESEND_API, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${this.apiKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          from: this.from,
          to: [message.to],
          subject: message.subject,
          text: message.text,
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        logger.error({ status: res.status, body, to: message.to }, 'email_send_failed');
      }
    } catch (err) {
      logger.error({ err, to: message.to }, 'email_send_failed');
    }
  }
}
