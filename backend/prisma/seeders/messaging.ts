import type { PrismaClient } from '@prisma/client';
import { idGenerator } from '../../src/shared/helpers/id_generator.js';

export async function seedMessaging(
  prisma: PrismaClient,
  tenantId: string,
  maria?: { id: string; name: string; phone: string },
) {
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
        status: 'ACTIVE',
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

  await seedInboxConversation(prisma, tenantId, maria);
}

async function seedInboxConversation(
  prisma: PrismaClient,
  tenantId: string,
  maria?: { id: string; name: string; phone: string },
) {
  if (!maria) return;

  let account = await prisma.whatsappAccount.findFirst({ where: { tenantId } });
  if (!account) {
    account = await prisma.whatsappAccount.create({
      data: {
        id: idGenerator.next(),
        tenantId,
        sessionName: `t${tenantId.replace(/-/g, '')}`,
        displayPhone: '5511999999999',
        riskAcceptedAt: new Date(),
        webhookVerifiedAt: new Date(),
        status: 'CONNECTED',
      },
    });
  } else if (account.status !== 'CONNECTED') {
    account = await prisma.whatsappAccount.update({
      where: { id: account.id },
      data: { status: 'CONNECTED', lastError: null, webhookVerifiedAt: new Date() },
    });
  }

  const digits = maria.phone.replace(/\D/g, '');
  const contactPhone = digits.startsWith('55') ? digits : `55${digits}`;

  let conversation = await prisma.conversation.findFirst({
    where: { tenantId, whatsappAccountId: account.id, contactPhone },
  });
  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        id: idGenerator.next(),
        tenantId,
        whatsappAccountId: account.id,
        patientId: maria.id,
        contactPhone,
        contactName: maria.name,
        status: 'PENDING',
        lastMessageAt: new Date(),
        unreadCount: 1,
      },
    });
  } else {
    conversation = await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        patientId: maria.id,
        contactName: maria.name,
        status: 'PENDING',
        unreadCount: conversation.unreadCount > 0 ? conversation.unreadCount : 1,
        lastMessageAt: conversation.lastMessageAt ?? new Date(),
      },
    });
  }

  const inbound = await prisma.message.findFirst({
    where: { tenantId, conversationId: conversation.id, providerMessageId: 'wamid.seed.maria.inbox' },
  });
  if (inbound) return;

  await prisma.message.create({
    data: {
      id: idGenerator.next(),
      tenantId,
      conversationId: conversation.id,
      direction: 'INBOUND',
      type: 'TEXT',
      body: 'Oi, quero remarcar',
      providerMessageId: 'wamid.seed.maria.inbox',
      status: 'DELIVERED',
    },
  });
}
