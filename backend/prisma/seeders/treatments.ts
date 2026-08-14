import type { PrismaClient } from '@prisma/client';
import { idGenerator } from '../../src/shared/helpers/id_generator.js';
import { PRICED_PROCEDURES, SEED_QUOTE_NOTES } from './constants.js';
import { dateOnly } from './helpers.js';

type SeedItem = {
  code: string;
  toothCode: string | null;
};

const MARIA_ITEMS: SeedItem[] = [
  { code: 'RES-01', toothCode: '26' },
  { code: 'PROF-01', toothCode: null },
  { code: 'RAD-01', toothCode: '16' },
];

async function nextQuoteNumber(prisma: PrismaClient, tenantId: string): Promise<bigint> {
  const rows = await prisma.$queryRaw<Array<{ last_number: bigint }>>`
    INSERT INTO quote_number_counter (tenant_id, last_number)
    VALUES (${tenantId}::uuid, 1)
    ON CONFLICT (tenant_id) DO UPDATE
    SET last_number = quote_number_counter.last_number + 1
    RETURNING last_number
  `;
  return rows[0]?.last_number ?? 1n;
}

function unitPriceFor(code: string, catalogCents: bigint): bigint {
  if (catalogCents > 0n) return catalogCents;
  return BigInt(PRICED_PROCEDURES[code] ?? 0);
}

export async function seedTreatments(
  prisma: PrismaClient,
  input: {
    tenantId: string;
    unitId: string;
    patientId: string;
    professionalId: string;
  },
) {
  const existingDraft = await prisma.quote.findFirst({
    where: {
      tenantId: input.tenantId,
      patientId: input.patientId,
      status: 'DRAFT',
      notes: { startsWith: '[seed]' },
    },
    include: { items: true },
  });
  if (existingDraft && existingDraft.items.length === MARIA_ITEMS.length) {
    console.info(`  quote DRAFT Maria já existe (#${existingDraft.number})`);
    return;
  }
  if (existingDraft) {
    await prisma.quote.delete({ where: { id: existingDraft.id } });
  }

  const procedures = [];
  for (const spec of MARIA_ITEMS) {
    const row = await prisma.procedure.findUnique({
      where: { tenantId_code: { tenantId: input.tenantId, code: spec.code } },
    });
    if (!row) {
      throw new Error(`seed: procedimento ${spec.code} ausente.`);
    }
    procedures.push({ spec, row });
  }

  const items = procedures.map((entry, sortOrder) => {
    const unitPrice = unitPriceFor(entry.spec.code, entry.row.priceCents);
    return {
      id: idGenerator.next(),
      tenantId: input.tenantId,
      procedureId: entry.row.id,
      toothCode: entry.spec.toothCode,
      quantity: 1,
      unitPriceCents: unitPrice,
      discountCents: 0n,
      totalCents: unitPrice,
      sortOrder,
      approved: true,
    };
  });
  const totalCents = items.reduce((acc, item) => acc + item.totalCents, 0n);
  const number = await nextQuoteNumber(prisma, input.tenantId);

  await prisma.quote.create({
    data: {
      id: idGenerator.next(),
      tenantId: input.tenantId,
      unitId: input.unitId,
      patientId: input.patientId,
      professionalId: input.professionalId,
      number,
      status: 'DRAFT',
      subtotalCents: totalCents,
      discountCents: 0n,
      totalCents,
      validUntil: dateOnly(30),
      notes: SEED_QUOTE_NOTES,
      items: { create: items },
    },
  });
  console.info(`  quote DRAFT Maria #${number} (RES-01 26 + PROF-01 + RAD-01 16)`);
}
