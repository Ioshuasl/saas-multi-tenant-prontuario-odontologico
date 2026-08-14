import type { PrismaClient } from '@prisma/client';
import { DEFAULT_PROCEDURE_CATALOG } from '../../src/modules/clinic/helpers/procedure_catalog.helper.js';
import { idGenerator } from '../../src/shared/helpers/id_generator.js';
import {
  BUSINESS_END,
  BUSINESS_START,
  CLINIC_NAME,
  PRICED_PROCEDURES,
  WEEKDAYS,
} from './constants.js';
import { dateOnly } from './helpers.js';

export async function seedClinic(prisma: PrismaClient, tenantId: string) {
  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      name: CLINIC_NAME,
      legalName: 'Clínica Teste Odontologia LTDA',
      taxId: '11222333000181',
      responsibleCro: 'CRO-SP 12345',
      timezone: 'America/Sao_Paulo',
      acceptedPaymentMethods: ['CASH', 'PIX', 'CREDIT_CARD', 'DEBIT_CARD'],
    },
  });

  let unit = await prisma.unit.findFirst({ where: { tenantId, isDefault: true } });
  if (!unit) {
    unit = await prisma.unit.create({
      data: {
        id: idGenerator.next(),
        tenantId,
        name: CLINIC_NAME,
        isDefault: true,
      },
    });
  }

  await prisma.unit.update({
    where: { id: unit.id },
    data: {
      phone: '1133334444',
      address: {
        street: 'Rua das Acácias',
        number: '120',
        complement: 'Sala 42',
        district: 'Jardins',
        city: 'São Paulo',
        state: 'SP',
        postalCode: '01415000',
      },
    },
  });

  const hoursCount = await prisma.businessHours.count({ where: { tenantId, unitId: unit.id } });
  if (hoursCount === 0) {
    for (const weekday of WEEKDAYS) {
      await prisma.businessHours.create({
        data: {
          id: idGenerator.next(),
          tenantId,
          unitId: unit.id,
          weekday,
          startsAt: BUSINESS_START,
          endsAt: BUSINESS_END,
        },
      });
    }
  }

  for (const procedure of DEFAULT_PROCEDURE_CATALOG) {
    const existing = await prisma.procedure.findUnique({
      where: { tenantId_code: { tenantId, code: procedure.code } },
    });
    const priceCents = BigInt(PRICED_PROCEDURES[procedure.code] ?? 0);
    if (!existing) {
      await prisma.procedure.create({
        data: {
          id: idGenerator.next(),
          tenantId,
          code: procedure.code,
          name: procedure.name,
          specialty: procedure.specialty,
          defaultMinutes: procedure.defaultMinutes,
          priceCents,
          requiresTooth: procedure.requiresTooth,
          requiresFace: procedure.requiresFace ?? false,
          publiclyBookable: procedure.code === 'CONS-01' || procedure.code === 'PROF-01',
        },
      });
    } else {
      const publiclyBookable = procedure.code === 'CONS-01' || procedure.code === 'PROF-01';
      const priceUpdate =
        PRICED_PROCEDURES[procedure.code] && existing.priceCents === BigInt(0)
          ? { priceCents }
          : {};
      if (existing.publiclyBookable !== publiclyBookable || Object.keys(priceUpdate).length > 0) {
        await prisma.procedure.update({
          where: { id: existing.id },
          data: { ...priceUpdate, publiclyBookable },
        });
      }
    }
  }

  const holiday = dateOnly(21);
  const exceptionExists = await prisma.businessHoursException.findFirst({
    where: { tenantId, unitId: unit.id, date: holiday, reason: { startsWith: '[seed]' } },
  });
  if (!exceptionExists) {
    await prisma.businessHoursException.create({
      data: {
        id: idGenerator.next(),
        tenantId,
        unitId: unit.id,
        date: holiday,
        closed: true,
        reason: '[seed] Feriado municipal',
      },
    });
  }

  return unit;
}

export async function seedClinicTeam(
  prisma: PrismaClient,
  input: { tenantId: string; ownerMembershipId: string; dentistMembershipId: string },
) {
  const ownerProfessional =
    (await prisma.professional.findUnique({ where: { membershipId: input.ownerMembershipId } })) ??
    (await prisma.professional.create({
      data: {
        id: idGenerator.next(),
        tenantId: input.tenantId,
        membershipId: input.ownerMembershipId,
        croNumber: '12345',
        croState: 'SP',
        specialties: ['Clínica geral', 'Dentística'],
        color: '#0B6E99',
        active: true,
      },
    }));

  const dentistProfessional =
    (await prisma.professional.findUnique({ where: { membershipId: input.dentistMembershipId } })) ??
    (await prisma.professional.create({
      data: {
        id: idGenerator.next(),
        tenantId: input.tenantId,
        membershipId: input.dentistMembershipId,
        croNumber: '67890',
        croState: 'SP',
        specialties: ['Endodontia', 'Cirurgia'],
        color: '#448361',
        active: true,
      },
    }));

  return { ownerProfessional, dentistProfessional };
}

export async function seedClinicChairs(prisma: PrismaClient, tenantId: string, unitId: string) {
  const wanted = [
    { name: 'Cadeira 1', color: '#0B6E99' },
    { name: 'Cadeira 2', color: '#448361' },
  ];
  const chairs = [];
  for (const item of wanted) {
    const existing = await prisma.chair.findFirst({ where: { tenantId, unitId, name: item.name } });
    chairs.push(
      existing ??
        (await prisma.chair.create({
          data: {
            id: idGenerator.next(),
            tenantId,
            unitId,
            name: item.name,
            color: item.color,
            active: true,
          },
        })),
    );
  }
  return chairs;
}
