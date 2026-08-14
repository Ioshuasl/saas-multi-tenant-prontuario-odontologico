import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { UnitOfWork } from '../../../../shared/database/unit_of_work.js';
import { getEmailProvider } from '../../../../shared/integrations/email/index.js';
import { getObjectStorage, ObjectStorageError } from '../../../../shared/storage/index.js';
import { AppError } from '../../../../shared/middlewares/error_handler.middleware.js';
import { getPublicClinicCatalog } from '../../../clinic/clinic_public.js';
import { getWhatsappAccountStatus } from '../../../messaging/messaging_public.js';
import { getPatientById } from '../../../patients/patients_public.js';
import {
  PatientNotFoundError,
  PaymentNotFoundError,
  ReceiptPdfPendingError,
} from '../../models/errors/billing.errors.js';
import { formatMoneyLabel } from '../../helpers/receipt_pdf.helper.js';
import { GetReceiptRepository } from '../../repositories/payment/payment_receipt.repository.js';
import type { ReceiptSendSchema } from '../../schemas/billing.schema.js';
import type { ReceiptSendChannel } from '../../enum/receipt/send_channel.enum.js';
import type { ReceiptSendResult } from '../../types/receipt/receipt.types.js';

const EXPIRES_IN = 900;

export class SendAction {
  constructor(
    private readonly get = new GetReceiptRepository(),
    private readonly uow = new UnitOfWork(),
    private readonly email = getEmailProvider(),
  ) {}

  async execute(
    ctx: RequestContext,
    paymentId: string,
    sendSchema: ReceiptSendSchema,
  ): Promise<ReceiptSendResult> {
    const receipt = await this.get.execute(ctx, paymentId);
    if (!receipt) throw new PaymentNotFoundError();
    if (!receipt.pdfStorageKey) throw new ReceiptPdfPendingError();

    const catalog = await getPublicClinicCatalog(ctx);
    const clinicName = catalog?.name ?? 'Clínica';
    const patient = await getPatientById(ctx, receipt.patientId);
    if (!patient) throw new PatientNotFoundError();

    let signedUrl: string;
    try {
      signedUrl = (await getObjectStorage().presignGet(receipt.pdfStorageKey, EXPIRES_IN)).url;
    } catch (err) {
      if (err instanceof ObjectStorageError) {
        throw new AppError('STORAGE_UNAVAILABLE', 'Armazenamento indisponível.', 503);
      }
      throw err;
    }

    const waba = await getWhatsappAccountStatus(ctx);
    const wabaConnected = waba?.status === 'CONNECTED' && !waba.killSwitch;
    let sentVia: ReceiptSendChannel = sendSchema.channel;
    if (sendSchema.channel === 'WHATSAPP' && !wabaConnected) {
      sentVia = patient.email ? 'EMAIL' : 'COPY';
    }
    if (sendSchema.channel === 'EMAIL' && !patient.email) {
      sentVia = 'COPY';
    }

    const firstName = patient.name.split(/\s+/)[0] ?? patient.name;
    const receiptNumber = Number(receipt.receiptNumber);
    const valor = `${formatMoneyLabel(receipt.amountCents)} · recibo nº ${receiptNumber}`;
    const copyText = `Olá ${firstName}, a ${clinicName} enviou o recibo ${valor}. Este documento não é nota fiscal. ${signedUrl}`;

    await this.uow.run(ctx, async ({ publish }) => {
      publish([
        {
          name: 'billing.receipt_sent',
          payload: {
            paymentId,
            patientId: patient.id,
            requestId: ctx.requestId,
            channel: sentVia,
            publicUrl: signedUrl,
            valor,
            templateKey: 'payment_receipt',
            relatedType: 'PAYMENT',
            relatedId: paymentId,
          },
        },
      ]);
    });

    if (sentVia === 'EMAIL' && patient.email) {
      await this.email.send({
        to: patient.email,
        subject: `Recibo — ${clinicName}`,
        text: copyText,
      });
    }

    return {
      sentVia,
      receiptNumber,
      ...(sentVia === 'COPY' ? { copyText } : {}),
    };
  }
}
