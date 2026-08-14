import type { PrismaClient } from '@prisma/client';
import { idGenerator } from '../../src/shared/helpers/id_generator.js';

export async function seedBilling(prisma: PrismaClient, tenantId: string) {
  const existing = await prisma.financialCategory.findFirst({
    where: { tenantId, name: 'Procedimentos', kind: 'REVENUE' },
  });
  if (existing) return;
  await prisma.financialCategory.create({
    data: {
      id: idGenerator.next(),
      tenantId,
      name: 'Procedimentos',
      kind: 'REVENUE',
      active: true,
    },
  });
}
