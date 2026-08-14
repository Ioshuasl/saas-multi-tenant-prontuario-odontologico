import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { TenantPrisma } from '../src/shared/database/tenant_prisma.js';
import { createReceivableFromApprovedQuote } from '../src/modules/billing/billing_public.js';

config({ path: resolve(process.cwd(), '../.env') });
config({ path: resolve(process.cwd(), '.env') });

/**
 * Verifica isolamento RLS com o role app_user (sem BYPASSRLS).
 * Uso: pnpm test:rls (DATABASE_URL deve ser app_user)
 */
async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL obrigatório');
  if (url.includes('postgres:postgres') || url.includes('app_migrator')) {
    console.warn(
      'Aviso: DATABASE_URL parece superuser/migrator — RLS pode ser bypassada. Use app_user.',
    );
  }

  const prisma = new PrismaClient();
  const tenantDb = new TenantPrisma(prisma);

  const tenantA = randomUUID();
  const tenantB = randomUUID();

  await tenantDb.runProvisioning(async (tx) => {
    await tx.tenant.create({
      data: {
        id: tenantA,
        name: 'Clinica A',
        slug: `clinica-a-${tenantA.slice(0, 8)}`,
        updatedAt: new Date(),
      },
    });
    await tx.tenant.create({
      data: {
        id: tenantB,
        name: 'Clinica B',
        slug: `clinica-b-${tenantB.slice(0, 8)}`,
        updatedAt: new Date(),
      },
    });
  });

  const ctxA = { tenantId: tenantA, userId: randomUUID(), requestId: randomUUID() };
  const ctxB = { tenantId: tenantB, userId: randomUUID(), requestId: randomUUID() };

  await tenantDb.runInTenantContext(ctxA, async (tx) => {
    await tx.auditLog.create({
      data: {
        id: randomUUID(),
        tenantId: tenantA,
        actorType: 'SYSTEM',
        action: 'CREATE',
        resourceType: 'tenant',
        resourceId: tenantA,
      },
    });
  });

  const visibleToA = await tenantDb.runInTenantContext(ctxA, async (tx) =>
    tx.auditLog.findMany(),
  );
  const visibleToB = await tenantDb.runInTenantContext(ctxB, async (tx) =>
    tx.auditLog.findMany(),
  );
  const withoutCtx = await prisma.auditLog.findMany();

  const tablesWithoutRls = await prisma.$queryRaw<{ relname: string }[]>`
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN information_schema.columns col
      ON col.table_name = c.relname AND col.column_name = 'tenant_id'
    WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity
  `;

  let failed = false;

  if (visibleToA.length !== 1) {
    console.error('FAIL: tenant A deveria ver 1 audit_log, viu', visibleToA.length);
    failed = true;
  }
  if (visibleToB.length !== 0) {
    console.error('FAIL: tenant B deveria ver 0 audit_log, viu', visibleToB.length);
    failed = true;
  }
  if (withoutCtx.length !== 0) {
    console.error(
      'FAIL: sem contexto app.tenant_id deveria ver 0 (app_user); viu',
      withoutCtx.length,
    );
    failed = true;
  }
  if (tablesWithoutRls.length !== 0) {
    console.error(
      'FAIL: tabelas com tenant_id sem RLS:',
      tablesWithoutRls.map((t) => t.relname).join(', '),
    );
    failed = true;
  }

  // INSERT com tenant_id divergente do contexto deve falhar (WITH CHECK)
  try {
    await tenantDb.runInTenantContext(ctxA, async (tx) => {
      await tx.auditLog.create({
        data: {
          id: randomUUID(),
          tenantId: tenantB,
          actorType: 'SYSTEM',
          action: 'CREATE',
          resourceType: 'tenant',
        },
      });
    });
    console.error('FAIL: INSERT cross-tenant deveria falhar');
    failed = true;
  } catch {
    // esperado
  }

  const outboxA = randomUUID();
  await tenantDb.runInTenantContext(ctxA, async (tx) => {
    await tx.outboxEvent.create({
      data: {
        id: outboxA,
        tenantId: tenantA,
        name: 'platform.smoke_ping',
        payload: { requestId: ctxA.requestId },
      },
    });
  });

  const outboxVisibleA = await tenantDb.runInTenantContext(ctxA, (tx) => tx.outboxEvent.findMany());
  const outboxVisibleB = await tenantDb.runInTenantContext(ctxB, (tx) => tx.outboxEvent.findMany());
  const outboxWithoutCtx = await prisma.outboxEvent.findMany();
  const outboxViaDispatch = await tenantDb.runOutboxDispatch((tx) => tx.outboxEvent.findMany());

  if (outboxVisibleA.length !== 1) {
    console.error('FAIL: tenant A deveria ver 1 outbox_event, viu', outboxVisibleA.length);
    failed = true;
  }
  if (outboxVisibleB.length !== 0) {
    console.error('FAIL: tenant B deveria ver 0 outbox_event, viu', outboxVisibleB.length);
    failed = true;
  }
  if (outboxWithoutCtx.length !== 0) {
    console.error('FAIL: sem tenant_id deveria ver 0 outbox_event; viu', outboxWithoutCtx.length);
    failed = true;
  }
  if (!outboxViaDispatch.some((row) => row.id === outboxA)) {
    console.error('FAIL: dispatcher (app.outbox_dispatch) deveria ler outbox cross-tenant');
    failed = true;
  }

  const tokenA = randomUUID();
  await tenantDb.runInTenantContext(ctxA, async (tx) => {
    await tx.publicBookingToken.create({
      data: {
        id: tokenA,
        tenantId: tenantA,
        purpose: 'BOOKING',
        tokenHash: `hash-${tokenA}`,
        expiresAt: new Date(Date.now() + 60_000),
      },
    });
  });
  const tokenVisibleA = await tenantDb.runInTenantContext(ctxA, (tx) =>
    tx.publicBookingToken.findMany(),
  );
  const tokenVisibleB = await tenantDb.runInTenantContext(ctxB, (tx) =>
    tx.publicBookingToken.findMany(),
  );
  const tokenWithoutCtx = await prisma.publicBookingToken.findMany();
  if (tokenVisibleA.length !== 1) {
    console.error('FAIL: tenant A deveria ver 1 public_booking_token, viu', tokenVisibleA.length);
    failed = true;
  }
  if (tokenVisibleB.length !== 0) {
    console.error('FAIL: tenant B deveria ver 0 public_booking_token, viu', tokenVisibleB.length);
    failed = true;
  }
  if (tokenWithoutCtx.length !== 0) {
    console.error('FAIL: sem tenant_id deveria ver 0 public_booking_token; viu', tokenWithoutCtx.length);
    failed = true;
  }

  const unitA = randomUUID();
  const patientA = randomUUID();
  const waitlistA = randomUUID();
  await tenantDb.runInTenantContext(ctxA, async (tx) => {
    await tx.unit.create({
      data: { id: unitA, tenantId: tenantA, name: 'Unidade A', isDefault: true },
    });
    await tx.patient.create({
      data: {
        id: patientA,
        tenantId: tenantA,
        unitId: unitA,
        code: BigInt(1),
        name: 'Paciente A',
        phonePrimary: '5562999900001',
      },
    });
    await tx.waitlistEntry.create({
      data: {
        id: waitlistA,
        tenantId: tenantA,
        unitId: unitA,
        patientId: patientA,
        preferredPeriods: [],
        priority: 0,
        status: 'WAITING',
      },
    });
  });
  const waitlistVisibleA = await tenantDb.runInTenantContext(ctxA, (tx) => tx.waitlistEntry.findMany());
  const waitlistVisibleB = await tenantDb.runInTenantContext(ctxB, (tx) => tx.waitlistEntry.findMany());
  const waitlistWithoutCtx = await prisma.waitlistEntry.findMany();
  if (waitlistVisibleA.length !== 1) {
    console.error('FAIL: tenant A deveria ver 1 waitlist_entry, viu', waitlistVisibleA.length);
    failed = true;
  }
  if (waitlistVisibleB.length !== 0) {
    console.error('FAIL: tenant B deveria ver 0 waitlist_entry, viu', waitlistVisibleB.length);
    failed = true;
  }
  if (waitlistWithoutCtx.length !== 0) {
    console.error('FAIL: sem tenant_id deveria ver 0 waitlist_entry; viu', waitlistWithoutCtx.length);
    failed = true;
  }

  const recordA = randomUUID();
  await tenantDb.runInTenantContext(ctxA, async (tx) => {
    await tx.medicalRecord.create({
      data: {
        id: recordA,
        tenantId: tenantA,
        patientId: patientA,
      },
    });
  });
  const recordVisibleA = await tenantDb.runInTenantContext(ctxA, (tx) =>
    tx.medicalRecord.findMany(),
  );
  const recordVisibleB = await tenantDb.runInTenantContext(ctxB, (tx) =>
    tx.medicalRecord.findMany(),
  );
  const recordWithoutCtx = await prisma.medicalRecord.findMany();
  if (recordVisibleA.length !== 1) {
    console.error('FAIL: tenant A deveria ver 1 medical_record, viu', recordVisibleA.length);
    failed = true;
  }
  if (recordVisibleB.length !== 0) {
    console.error('FAIL: tenant B deveria ver 0 medical_record, viu', recordVisibleB.length);
    failed = true;
  }
  if (recordWithoutCtx.length !== 0) {
    console.error('FAIL: sem tenant_id deveria ver 0 medical_record; viu', recordWithoutCtx.length);
    failed = true;
  }

  try {
    await tenantDb.runInTenantContext(ctxA, async (tx) => {
      await tx.medicalRecord.create({
        data: {
          id: randomUUID(),
          tenantId: tenantB,
          patientId: patientA,
        },
      });
    });
    console.error('FAIL: INSERT medical_record cross-tenant deveria falhar');
    failed = true;
  } catch {
    // esperado
  }

  const attachA = randomUUID();
  await tenantDb.runInTenantContext(ctxA, async (tx) => {
    await tx.attachment.create({
      data: {
        id: attachA,
        tenantId: tenantA,
        medicalRecordId: recordA,
        patientId: patientA,
        category: 'XRAY',
        fileName: 'rx.jpg',
        storageKey: `tenants/${tenantA}/patients/${patientA}/rx.jpg`,
        mimeType: 'image/jpeg',
        sizeBytes: BigInt(100),
        checksumSha256: 'b'.repeat(64),
        uploadedBy: ctxA.userId,
      },
    });
  });
  const attachVisibleA = await tenantDb.runInTenantContext(ctxA, (tx) => tx.attachment.findMany());
  const attachVisibleB = await tenantDb.runInTenantContext(ctxB, (tx) => tx.attachment.findMany());
  const attachWithoutCtx = await prisma.attachment.findMany();
  if (attachVisibleA.length !== 1) {
    console.error('FAIL: tenant A deveria ver 1 attachment, viu', attachVisibleA.length);
    failed = true;
  }
  if (attachVisibleB.length !== 0) {
    console.error('FAIL: tenant B deveria ver 0 attachment, viu', attachVisibleB.length);
    failed = true;
  }
  if (attachWithoutCtx.length !== 0) {
    console.error('FAIL: sem tenant_id deveria ver 0 attachment; viu', attachWithoutCtx.length);
    failed = true;
  }

  const waA = randomUUID();
  await tenantDb.runInTenantContext(ctxA, async (tx) => {
    await tx.whatsappAccount.create({
      data: {
        id: waA,
        tenantId: tenantA,
        sessionName: `t${tenantA.replace(/-/g, '')}`,
        displayPhone: '5562999900001',
        status: 'PENDING',
      },
    });
  });
  const waVisibleA = await tenantDb.runInTenantContext(ctxA, (tx) => tx.whatsappAccount.findMany());
  const waVisibleB = await tenantDb.runInTenantContext(ctxB, (tx) => tx.whatsappAccount.findMany());
  const waWithoutCtx = await prisma.whatsappAccount.findMany();
  if (waVisibleA.length !== 1) {
    console.error('FAIL: tenant A deveria ver 1 whatsapp_account, viu', waVisibleA.length);
    failed = true;
  }
  if (waVisibleB.length !== 0) {
    console.error('FAIL: tenant B deveria ver 0 whatsapp_account, viu', waVisibleB.length);
    failed = true;
  }
  if (waWithoutCtx.length !== 0) {
    console.error('FAIL: sem tenant_id deveria ver 0 whatsapp_account; viu', waWithoutCtx.length);
    failed = true;
  }

  const quoteCounterA = await tenantDb.runInTenantContext(ctxA, async (tx) => {
    await tx.quoteNumberCounter.create({
      data: { tenantId: tenantA, lastNumber: BigInt(1) },
    });
    return tx.quoteNumberCounter.findMany();
  });
  const quoteCounterB = await tenantDb.runInTenantContext(ctxB, (tx) =>
    tx.quoteNumberCounter.findMany(),
  );
  if (quoteCounterA.length !== 1) {
    console.error('FAIL: tenant A deveria ver 1 quote_number_counter, viu', quoteCounterA.length);
    failed = true;
  }
  if (quoteCounterB.length !== 0) {
    console.error('FAIL: tenant B deveria ver 0 quote_number_counter, viu', quoteCounterB.length);
    failed = true;
  }

  const categoryA = randomUUID();
  const planA = randomUUID();
  const receivableA = randomUUID();
  const installmentA = randomUUID();
  await tenantDb.runInTenantContext(ctxA, async (tx) => {
    await tx.financialCategory.create({
      data: {
        id: categoryA,
        tenantId: tenantA,
        name: 'Procedimentos',
        kind: 'REVENUE',
      },
    });
    await tx.treatmentPlan.create({
      data: {
        id: planA,
        tenantId: tenantA,
        patientId: patientA,
        status: 'ACTIVE',
      },
    });
    await tx.receivable.create({
      data: {
        id: receivableA,
        tenantId: tenantA,
        unitId: unitA,
        patientId: patientA,
        treatmentPlanId: planA,
        totalCents: BigInt(10000),
        installmentCount: 2,
        status: 'OPEN',
        categoryId: categoryA,
      },
    });
    await tx.installment.create({
      data: {
        id: installmentA,
        tenantId: tenantA,
        receivableId: receivableA,
        number: 1,
        dueDate: new Date('2026-09-05T00:00:00.000Z'),
        amountCents: BigInt(5000),
        status: 'OPEN',
      },
    });
  });

  const quoteVisibleA = await tenantDb.runInTenantContext(ctxA, async (tx) => ({
    category: await tx.financialCategory.findMany(),
    plan: await tx.treatmentPlan.findMany(),
    receivable: await tx.receivable.findMany(),
    installment: await tx.installment.findMany(),
  }));
  const quoteVisibleB = await tenantDb.runInTenantContext(ctxB, async (tx) => ({
    category: await tx.financialCategory.findMany(),
    plan: await tx.treatmentPlan.findMany(),
    receivable: await tx.receivable.findMany(),
    installment: await tx.installment.findMany(),
  }));
  const quoteWithoutCtx = {
    category: await prisma.financialCategory.findMany(),
    plan: await prisma.treatmentPlan.findMany(),
    receivable: await prisma.receivable.findMany(),
    installment: await prisma.installment.findMany(),
  };

  if (quoteVisibleA.receivable.length !== 1 || quoteVisibleA.installment.length !== 1) {
    console.error('FAIL: tenant A deveria ver 1 receivable/installment');
    failed = true;
  }
  if (
    quoteVisibleB.category.length !== 0 ||
    quoteVisibleB.plan.length !== 0 ||
    quoteVisibleB.receivable.length !== 0 ||
    quoteVisibleB.installment.length !== 0
  ) {
    console.error('FAIL: tenant B deveria ver 0 linhas de treatments/billing');
    failed = true;
  }
  if (
    quoteWithoutCtx.receivable.length !== 0 ||
    quoteWithoutCtx.installment.length !== 0 ||
    quoteWithoutCtx.plan.length !== 0
  ) {
    console.error('FAIL: sem tenant_id deveria ver 0 treatments/billing');
    failed = true;
  }

  const receiptCounterA = await tenantDb.runInTenantContext(ctxA, async (tx) => {
    await tx.receiptNumberCounter.create({
      data: { tenantId: tenantA, lastNumber: BigInt(1) },
    });
    return tx.receiptNumberCounter.findMany();
  });
  const receiptCounterB = await tenantDb.runInTenantContext(ctxB, (tx) =>
    tx.receiptNumberCounter.findMany(),
  );
  if (receiptCounterA.length !== 1) {
    console.error('FAIL: tenant A deveria ver 1 receipt_number_counter, viu', receiptCounterA.length);
    failed = true;
  }
  if (receiptCounterB.length !== 0) {
    console.error('FAIL: tenant B deveria ver 0 receipt_number_counter, viu', receiptCounterB.length);
    failed = true;
  }

  const cashSessionA = randomUUID();
  const paymentA = randomUUID();
  const payableA = randomUUID();
  const expenseCategoryA = randomUUID();
  await tenantDb.runInTenantContext(ctxA, async (tx) => {
    await tx.financialCategory.create({
      data: {
        id: expenseCategoryA,
        tenantId: tenantA,
        name: 'Aluguel e condomínio',
        kind: 'EXPENSE',
      },
    });
    await tx.cashSession.create({
      data: {
        id: cashSessionA,
        tenantId: tenantA,
        unitId: unitA,
        openedBy: ctxA.userId,
        openingCents: BigInt(0),
        status: 'OPEN',
      },
    });
    await tx.payment.create({
      data: {
        id: paymentA,
        tenantId: tenantA,
        unitId: unitA,
        installmentId: installmentA,
        cashSessionId: cashSessionA,
        amountCents: BigInt(3000),
        receivedBy: ctxA.userId,
        receiptNumber: BigInt(1),
        idempotencyKey: `rls-${paymentA}`,
      },
    });
    await tx.paymentSplit.create({
      data: {
        id: randomUUID(),
        tenantId: tenantA,
        paymentId: paymentA,
        method: 'PIX',
        amountCents: BigInt(2000),
      },
    });
    await tx.paymentSplit.create({
      data: {
        id: randomUUID(),
        tenantId: tenantA,
        paymentId: paymentA,
        method: 'CASH',
        amountCents: BigInt(1000),
      },
    });
    await tx.patientCreditLedger.create({
      data: {
        id: randomUUID(),
        tenantId: tenantA,
        patientId: patientA,
        paymentId: paymentA,
        amountCents: BigInt(100),
        kind: 'CREDIT',
      },
    });
    await tx.cashMovement.create({
      data: {
        id: randomUUID(),
        tenantId: tenantA,
        cashSessionId: cashSessionA,
        kind: 'PAYMENT_IN',
        amountCents: BigInt(1000),
        method: 'CASH',
        paymentId: paymentA,
        createdBy: ctxA.userId,
      },
    });
    await tx.payable.create({
      data: {
        id: payableA,
        tenantId: tenantA,
        unitId: unitA,
        categoryId: expenseCategoryA,
        description: 'Aluguel',
        amountCents: BigInt(250000),
        dueDate: new Date('2026-09-10T00:00:00.000Z'),
        status: 'OPEN',
      },
    });
    await tx.installment.update({
      where: { id: installmentA },
      data: { status: 'PARTIALLY_PAID', paidCents: BigInt(3000) },
    });
  });

  const billingE7A = await tenantDb.runInTenantContext(ctxA, async (tx) => ({
    payment: await tx.payment.findMany(),
    split: await tx.paymentSplit.findMany(),
    credit: await tx.patientCreditLedger.findMany(),
    cash: await tx.cashSession.findMany(),
    movement: await tx.cashMovement.findMany(),
    payable: await tx.payable.findMany(),
  }));
  const billingE7B = await tenantDb.runInTenantContext(ctxB, async (tx) => ({
    payment: await tx.payment.findMany(),
    split: await tx.paymentSplit.findMany(),
    credit: await tx.patientCreditLedger.findMany(),
    cash: await tx.cashSession.findMany(),
    movement: await tx.cashMovement.findMany(),
    payable: await tx.payable.findMany(),
  }));
  const billingE7Without = {
    payment: await prisma.payment.findMany(),
    split: await prisma.paymentSplit.findMany(),
    cash: await prisma.cashSession.findMany(),
    payable: await prisma.payable.findMany(),
  };

  if (billingE7A.payment.length !== 1 || billingE7A.split.length !== 2 || billingE7A.cash.length !== 1) {
    console.error('FAIL: tenant A deveria ver payment/splits/caixa S6');
    failed = true;
  }
  if (
    billingE7B.payment.length !== 0 ||
    billingE7B.split.length !== 0 ||
    billingE7B.credit.length !== 0 ||
    billingE7B.cash.length !== 0 ||
    billingE7B.movement.length !== 0 ||
    billingE7B.payable.length !== 0
  ) {
    console.error('FAIL: tenant B deveria ver 0 linhas de payment/caixa/AP');
    failed = true;
  }
  if (
    billingE7Without.payment.length !== 0 ||
    billingE7Without.split.length !== 0 ||
    billingE7Without.cash.length !== 0 ||
    billingE7Without.payable.length !== 0
  ) {
    console.error('FAIL: sem tenant_id deveria ver 0 payment/caixa/AP');
    failed = true;
  }

  try {
    await tenantDb.runInTenantContext(ctxA, async (tx) => {
      await tx.payment.create({
        data: {
          id: randomUUID(),
          tenantId: tenantB,
          unitId: unitA,
          installmentId: installmentA,
          amountCents: BigInt(1),
          receivedBy: ctxA.userId,
          receiptNumber: BigInt(2),
        },
      });
    });
    console.error('FAIL: INSERT payment cross-tenant deveria falhar');
    failed = true;
  } catch {
    // esperado
  }

  try {
    await tenantDb.runInTenantContext(ctxA, async (tx) => {
      await tx.receivable.create({
        data: {
          id: randomUUID(),
          tenantId: tenantB,
          unitId: unitA,
          patientId: patientA,
          totalCents: BigInt(1),
          installmentCount: 1,
          status: 'OPEN',
        },
      });
    });
    console.error('FAIL: INSERT receivable cross-tenant deveria falhar');
    failed = true;
  } catch {
    // esperado
  }

  const userA = randomUUID();
  const membershipA = randomUUID();
  const professionalA = randomUUID();
  const quoteA = randomUUID();
  await prisma.user.create({
    data: {
      id: userA,
      email: `rls-a-${userA.slice(0, 8)}@teste.local`,
      name: 'RLS Dentista',
      passwordHash: 'x',
    },
  });
  await tenantDb.runInTenantContext(ctxA, async (tx) => {
    await tx.membership.create({
      data: {
        id: membershipA,
        tenantId: tenantA,
        userId: userA,
        role: 'DENTIST',
      },
    });
    await tx.professional.create({
      data: {
        id: professionalA,
        tenantId: tenantA,
        membershipId: membershipA,
        croNumber: '12345',
        croState: 'GO',
      },
    });
    await tx.quote.create({
      data: {
        id: quoteA,
        tenantId: tenantA,
        unitId: unitA,
        patientId: patientA,
        professionalId: professionalA,
        number: BigInt(1),
        status: 'DRAFT',
        totalCents: BigInt(35000),
      },
    });
  });
  const quotesA = await tenantDb.runInTenantContext(ctxA, (tx) => tx.quote.findMany());
  const quotesB = await tenantDb.runInTenantContext(ctxB, (tx) => tx.quote.findMany());
  const quotesWithout = await prisma.quote.findMany();
  if (quotesA.length !== 1) {
    console.error('FAIL: tenant A deveria ver 1 quote, viu', quotesA.length);
    failed = true;
  }
  if (quotesB.length !== 0) {
    console.error('FAIL: tenant B deveria ver 0 quote, viu', quotesB.length);
    failed = true;
  }
  if (quotesWithout.length !== 0) {
    console.error('FAIL: sem tenant_id deveria ver 0 quote; viu', quotesWithout.length);
    failed = true;
  }

  try {
    const created = await createReceivableFromApprovedQuote(ctxA, {
      patientId: patientA,
      unitId: unitA,
      quoteId: quoteA,
      treatmentPlanId: planA,
      totalCents: 10000n,
      installmentCount: 3,
      firstDueDate: '2026-09-05',
      downPaymentCents: 100n,
    });
    const installmentSum = created.installments.reduce((acc, row) => acc + row.amountCents, 0n);
    if (installmentSum + created.downPaymentCents !== created.totalCents) {
      console.error('FAIL: createReceivableFromApprovedQuote parcelas ≠ total');
      failed = true;
    }
    if (created.installments.length !== 3) {
      console.error('FAIL: createReceivableFromApprovedQuote deveria criar 3 parcelas');
      failed = true;
    }
  } catch (err) {
    console.error('FAIL: createReceivableFromApprovedQuote', err);
    failed = true;
  }

  await prisma.$disconnect();

  if (failed) {
    process.exit(1);
  }
  console.log('OK: RLS isolation checks passed');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
