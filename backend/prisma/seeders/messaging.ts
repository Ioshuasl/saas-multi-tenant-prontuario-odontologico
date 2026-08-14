import type { PrismaClient } from '@prisma/client';
import { idGenerator } from '../../src/shared/helpers/id_generator.js';

export async function seedMessaging(prisma: PrismaClient, tenantId: string) {
  const automations: Array<{ key: string; config: Record<string, unknown> }> = [
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
      config: { templateKey: 'waitlist_offer', onlyForStatuses: ['CANCELLED', 'NO_SHOW'] },
    },
  ];
  for (const automation of automations) {
    const existing = await prisma.automation.findFirst({
      where: { tenantId, key: automation.key },
    });
    if (existing) continue;
    await prisma.automation.create({
      data: {
        id: idGenerator.next(),
        tenantId,
        key: automation.key,
        enabled: true,
        config: automation.config,
      },
    });
  }

  const quoteTemplate = await prisma.messageTemplate.findFirst({
    where: { tenantId, key: 'quote_sent' },
  });
  if (!quoteTemplate) {
    await prisma.messageTemplate.create({
      data: {
        id: idGenerator.next(),
        tenantId,
        key: 'quote_sent',
        category: 'UTILITY',
        language: 'pt_BR',
        providerName: 'quote_sent',
        body: 'Olá {{nome}}, a {{clinica}} enviou um orçamento de {{valor}}: {{link}}',
        variables: ['nome', 'clinica', 'valor', 'link'],
        status: 'APPROVED',
      },
    });
  }

  const bonus = await prisma.messageCreditLedger.findFirst({
    where: { tenantId, kind: 'BONUS' },
  });
  if (!bonus) {
    await prisma.messageCreditLedger.create({
      data: {
        id: idGenerator.next(),
        tenantId,
        kind: 'BONUS',
        amountCents: BigInt(50),
        balanceAfterCents: BigInt(50),
      },
    });
  }
}
