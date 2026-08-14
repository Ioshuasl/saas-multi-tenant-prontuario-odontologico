import { randomBytes } from 'node:crypto';
import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { env } from '../../../../shared/config/env.js';
import { UnitOfWork } from '../../../../shared/database/unit_of_work.js';
import { hashToken } from '../../../../shared/helpers/token_hash.js';
import { getEmailProvider } from '../../../../shared/integrations/email/index.js';
import { getPublicClinicCatalog } from '../../../clinic/clinic_public.js';
import { getWhatsappAccountStatus } from '../../../messaging/messaging_public.js';
import { getPatientById } from '../../../patients/patients_public.js';
import {
  createPublicToken,
  getActivePublicToken,
} from '../../../scheduling/scheduling_public.js';
import {
  PatientRequiredError,
  QuoteExpiredError,
  QuoteNotFoundError,
  QuoteNotSendableError,
} from '../../models/errors/treatments.errors.js';
import { formatQuoteTotalLabel } from '../../helpers/quote_pdf.helper.js';
import {
  isCivilDatePast,
  quoteTokenExpiresAt,
  todayInTimezone,
} from '../../helpers/quote_valid_until.helper.js';
import { GetRepository } from '../../repositories/quote/quote_get.repository.js';
import { MarkSentRepository } from '../../repositories/quote/quote_send.repository.js';
import type { QuoteSendSchema } from '../../schemas/quote.schema.js';
import type { QuoteSendResult } from '../../types/quote/quote_send.types.js';
import type { QuoteSendChannel } from '../../enum/quote/send_channel.enum.js';

export class SendAction {
  constructor(
    private readonly get = new GetRepository(),
    private readonly markSent = new MarkSentRepository(),
    private readonly uow = new UnitOfWork(),
    private readonly email = getEmailProvider(),
  ) {}

  async execute(
    ctx: RequestContext,
    quoteId: string,
    sendSchema: QuoteSendSchema,
  ): Promise<QuoteSendResult> {
    const existing = await this.get.execute(ctx, quoteId);
    if (!existing) throw new QuoteNotFoundError();

    const catalog = await getPublicClinicCatalog(ctx);
    const timezone = catalog?.timezone ?? 'America/Sao_Paulo';
    const clinicName = catalog?.name ?? 'Clínica';
    if (existing.validUntil && isCivilDatePast(existing.validUntil, timezone)) {
      throw new QuoteExpiredError();
    }
    if (existing.status !== 'DRAFT' && existing.status !== 'SENT') {
      throw new QuoteNotSendableError(existing.status);
    }

    const patient = await getPatientById(ctx, existing.patientId);
    if (!patient) throw new PatientRequiredError();

    const waba = await getWhatsappAccountStatus(ctx);
    const wabaConnected = waba?.status === 'CONNECTED' && !waba.killSwitch;
    let sentVia: QuoteSendChannel = sendSchema.channel;
    if (sendSchema.channel === 'WHATSAPP' && !wabaConnected) {
      sentVia = patient.email ? 'EMAIL' : 'COPY';
    }
    if (sendSchema.channel === 'EMAIL' && !patient.email) {
      sentVia = 'COPY';
    }

    const expiresAt = quoteTokenExpiresAt(
      existing.validUntil ?? todayInTimezone(timezone),
      timezone,
    );

    const active = await getActivePublicToken(ctx, 'QUOTE', existing.id);
    let publicUrl = active?.meta.publicUrl;
    const firstName = patient.name.split(/\s+/)[0] ?? patient.name;
    const valor = formatQuoteTotalLabel(existing.totalCents);

    const quote = await this.uow.run(ctx, async ({ tx, publish }) => {
      if (!publicUrl) {
        const rawToken = randomBytes(24).toString('base64url');
        publicUrl = `${env.APP_PUBLIC_URL.replace(/\/$/, '')}/orcamento/${rawToken}`;
        await createPublicToken(
          ctx,
          {
            purpose: 'QUOTE',
            tokenHash: hashToken(rawToken),
            expiresAt,
            targetId: existing.id,
            meta: { quoteId: existing.id, patientId: patient.id, publicUrl },
          },
          tx,
        );
      }

      const sent =
        existing.status === 'DRAFT' ? await this.markSent.executeInTx(tx, existing.id) : existing;

      const events = [
        {
          name: 'treatments.quote_sent',
          payload: {
            quoteId: sent.id,
            patientId: patient.id,
            requestId: ctx.requestId,
            channel: sentVia,
            publicUrl,
            valor,
            templateKey: 'quote_sent',
          },
        },
      ];
      publish(events);
      return sent;
    });

    if (sentVia === 'EMAIL' && patient.email) {
      await this.email.send({
        to: patient.email,
        subject: `Orçamento — ${clinicName}`,
        text: `Olá ${firstName}, a ${clinicName} enviou um orçamento no valor de ${valor}: ${publicUrl}`,
      });
    }

    return {
      quote,
      sentVia,
      expiresAt: expiresAt.toISOString(),
      ...(sentVia === 'COPY' ? { publicUrl } : {}),
    };
  }
}
