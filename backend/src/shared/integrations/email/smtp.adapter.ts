import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import type { EmailMessage, EmailProvider } from './email.port.js';

function transportFromDsn(dsn: string): Transporter {
  const url = new URL(dsn);
  const port = url.port ? Number(url.port) : 25;
  const user = url.username ? decodeURIComponent(url.username) : undefined;
  const pass = url.password ? decodeURIComponent(url.password) : undefined;

  return nodemailer.createTransport({
    host: url.hostname,
    port,
    secure: port === 465,
    auth: user ? { user, pass: pass ?? '' } : undefined,
  });
}

export class SmtpEmailAdapter implements EmailProvider {
  constructor(
    private readonly transporter: Transporter = transportFromDsn(env.MAIL_DSN),
    private readonly from: string = env.MAIL_FROM,
  ) {}

  async send(message: EmailMessage): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.from,
        to: message.to,
        subject: message.subject,
        text: message.text,
      });
    } catch (err) {
      logger.error({ err, to: message.to }, 'email_send_failed');
    }
  }
}
