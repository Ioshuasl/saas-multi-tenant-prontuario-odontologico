import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { UnitOfWork } from '../../../../shared/database/unit_of_work.js';
import { getEmailProvider } from '../../../../shared/integrations/email/index.js';
import { getPublicClinicCatalog } from '../../../clinic/clinic_public.js';
import { getWhatsappAccountStatus } from '../../../messaging/messaging_public.js';
import { getPatientById } from '../../../patients/patients_public.js';
import {
  InstallmentNotChargeableError,
  InstallmentNotFoundError,
  PatientNotFoundError,
} from '../../models/errors/billing.errors.js';
import { dateOnly } from '../../helpers/money.helper.js';
import { formatMoneyLabel } from '../../helpers/receipt_pdf.helper.js';
import { tenantToday } from '../../helpers/tenant_today.helper.js';
import { effectiveInstallmentStatus, isPastDue } from '../../models/overdue.model.js';
import { GetRepository } from '../../repositories/installment/installment_get.repository.js';
import type { InstallmentChargeSchema } from '../../schemas/billing.schema.js';
import type { ReceiptSendChannel } from '../../enum/receipt/send_channel.enum.js';
import type { ChargeResult } from '../../types/installment/installment_charge.types.js';

export class ChargeAction {
  constructor(
    private readonly get = new GetRepository(),
    private readonly uow = new UnitOfWork(),
    private readonly email = getEmailProvider(),
  ) {}

  async execute(
    ctx: RequestContext,
    installmentId: string,
    chargeSchema: InstallmentChargeSchema,
  ): Promise<ChargeResult> {
    const installment = await this.get.execute(ctx, installmentId);
    if (!installment) throw new InstallmentNotFoundError();

    const today = await tenantToday(ctx);
    const due = dateOnly(installment.dueDate);
    const status = effectiveInstallmentStatus(installment.status, due, today);
    const remaining = installment.amountCents - installment.paidCents;
    if (remaining <= 0n || status === 'CANCELLED' || status === 'PAID' || !isPastDue(due, today)) {
      throw new InstallmentNotChargeableError();
    }

    const catalog = await getPublicClinicCatalog(ctx);
    const clinicName = catalog?.name ?? 'Clínica';
    const patient = await getPatientById(ctx, installment.patientId);
    if (!patient) throw new PatientNotFoundError();

    const waba = await getWhatsappAccountStatus(ctx);
    const wabaConnected = waba?.status === 'CONNECTED' && !waba.killSwitch;
    let sentVia: ReceiptSendChannel = chargeSchema.channel;
    if (chargeSchema.channel === 'WHATSAPP' && !wabaConnected) {
      sentVia = patient.email ? 'EMAIL' : 'COPY';
    }
    if (chargeSchema.channel === 'EMAIL' && !patient.email) {
      sentVia = 'COPY';
    }

    const firstName = patient.name.split(/\s+/)[0] ?? patient.name;
    const valor = formatMoneyLabel(remaining);
    const copyText = `Olá ${firstName}, a ${clinicName} informa parcela em atraso de ${valor} (vencimento ${due}).`;

    await this.uow.run(ctx, async ({ publish }) => {
      publish([
        {
          name: 'billing.installment_charged',
          payload: {
            installmentId,
            patientId: patient.id,
            requestId: ctx.requestId,
            channel: sentVia,
            valor,
            templateKey: 'payment_overdue',
            relatedType: 'INSTALLMENT',
            relatedId: installmentId,
          },
        },
      ]);
    });

    if (sentVia === 'EMAIL' && patient.email) {
      await this.email.send({
        to: patient.email,
        subject: `Parcela em atraso — ${clinicName}`,
        text: copyText,
      });
    }

    return {
      sentVia,
      installmentId,
      ...(sentVia === 'COPY' ? { copyText } : {}),
    };
  }
}
