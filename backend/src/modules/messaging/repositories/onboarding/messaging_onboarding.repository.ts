import type { DbTransaction } from '../../../../shared/database/db_transaction.js';
import type { Prisma } from '@prisma/client';

export type MessagingOnboardingInput = {
  tenantId: string;
  idNext: () => string;
  courtesyCredits: number;
};

const DEFAULT_AUTOMATIONS: Array<{ key: string; config: Prisma.InputJsonValue }> = [
  {
    key: 'CONFIRMATION_D1',
    config: {
      sendAtLocalTime: '12:00',
      onlyForStatuses: ['SCHEDULED', 'CONFIRMED'],
      templateKey: 'appointment_confirmation',
    },
  },
  {
    key: 'REMINDER_H3',
    config: {
      offsetHours: 3,
      onlyForStatuses: ['SCHEDULED', 'CONFIRMED'],
      templateKey: 'appointment_reminder',
    },
  },
  {
    key: 'WAITLIST_OFFER',
    config: {
      templateKey: 'waitlist_offer',
      onlyForStatuses: ['CANCELLED', 'NO_SHOW'],
    },
  },
];

export class MessagingOnboardingRepository {
  async execute(tx: DbTransaction, input: MessagingOnboardingInput): Promise<void> {
    for (const automation of DEFAULT_AUTOMATIONS) {
      const existing = await tx.automation.findFirst({
        where: { tenantId: input.tenantId, key: automation.key },
        select: { id: true },
      });
      if (existing) continue;
      await tx.automation.create({
        data: {
          id: input.idNext(),
          tenantId: input.tenantId,
          key: automation.key,
          enabled: true,
          config: automation.config,
        },
      });
    }

    const bonus = await tx.messageCreditLedger.findFirst({
      where: { tenantId: input.tenantId, kind: 'BONUS' },
      select: { id: true },
    });
    if (!bonus) {
      await tx.messageCreditLedger.create({
        data: {
          id: input.idNext(),
          tenantId: input.tenantId,
          kind: 'BONUS',
          amountCents: BigInt(input.courtesyCredits),
          balanceAfterCents: BigInt(input.courtesyCredits),
        },
      });
    }

    const defaults: Array<{
      key: string;
      body: string;
      variables: string[];
    }> = [
      {
        key: 'quote_sent',
        body: 'Olá {{nome}}, a {{clinica}} enviou um orçamento de {{valor}}: {{link}}',
        variables: ['nome', 'clinica', 'valor', 'link'],
      },
      {
        key: 'payment_receipt',
        body: 'Olá {{nome}}, a {{clinica}} enviou o recibo {{valor}}: {{link}}',
        variables: ['nome', 'clinica', 'valor', 'link'],
      },
      {
        key: 'payment_overdue',
        body: 'Olá {{nome}}, a {{clinica}} informa parcela em atraso de {{valor}} (vencimento {{data}}).',
        variables: ['nome', 'clinica', 'valor', 'data'],
      },
    ];
    for (const template of defaults) {
      const existing = await tx.messageTemplate.findFirst({
        where: { tenantId: input.tenantId, key: template.key },
        select: { id: true },
      });
      if (existing) continue;
      await tx.messageTemplate.create({
        data: {
          id: input.idNext(),
          tenantId: input.tenantId,
          key: template.key,
          category: 'UTILITY',
          language: 'pt_BR',
          providerName: template.key,
          body: template.body,
          variables: template.variables,
          status: 'ACTIVE',
        },
      });
    }
  }
}
