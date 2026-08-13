import { config } from 'dotenv';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/shared/helpers/password.js';
import { idGenerator } from '../src/shared/helpers/id_generator.js';
import { hashToken } from '../src/shared/helpers/token_hash.js';
import { Role } from '../src/modules/identity/enum/role/role.enum.js';
import { addDays, buildTenantSlug } from '../src/modules/identity/helpers/slug.helper.js';
import { DEFAULT_PROCEDURE_CATALOG } from '../src/modules/clinic/helpers/procedure_catalog.helper.js';

config({ path: resolve(process.cwd(), '../.env') });
config({ path: resolve(process.cwd(), '.env') });

const OWNER_EMAIL = 'owner@teste.local';
const OWNER_PASSWORD = 'SenhaForte!99';
const OWNER_NAME = 'Owner Teste';
const CLINIC_NAME = 'Clínica Teste';

const DENTIST_EMAIL = 'dentist@teste.local';
const RECEPTION_EMAIL = 'recepcao@teste.local';
const INVITE_EMAIL = 'auxiliar@teste.local';
const SEED_PASSWORD = OWNER_PASSWORD;
const INVITE_RAW_TOKEN = 'seed-invite-dev-token';

const BUSINESS_START = new Date('1970-01-01T08:00:00.000Z');
const BUSINESS_END = new Date('1970-01-01T18:00:00.000Z');
const WEEKDAYS = [1, 2, 3, 4, 5];

const PRICED_PROCEDURES: Record<string, number> = {
  'CONS-01': 15000,
  'PROF-01': 18000,
  'RAD-01': 8000,
  'RES-01': 35000,
  'URG-01': 20000,
};

function spCivilDate(offsetDays = 0): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  const [year, month, day] = parts.split('-').map(Number);
  const utc = Date.UTC(year, month - 1, day + offsetDays);
  const shifted = new Date(utc);
  const yyyy = shifted.getUTCFullYear();
  const mm = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(shifted.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function spDateTime(offsetDays: number, hour: number, minute = 0): Date {
  const ymd = spCivilDate(offsetDays);
  const hh = String(hour).padStart(2, '0');
  const min = String(minute).padStart(2, '0');
  return new Date(`${ymd}T${hh}:${min}:00-03:00`);
}

function dateOnly(offsetDays: number): Date {
  return new Date(`${spCivilDate(offsetDays)}T00:00:00.000Z`);
}

async function upsertUser(
  prisma: PrismaClient,
  input: { email: string; name: string; passwordHash: string },
) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) return existing;
  return prisma.user.create({
    data: {
      id: idGenerator.next(),
      email: input.email,
      name: input.name,
      passwordHash: input.passwordHash,
    },
  });
}

async function upsertMembership(
  prisma: PrismaClient,
  input: {
    tenantId: string;
    userId: string;
    role: string;
    defaultUnitId: string;
  },
) {
  const existing = await prisma.membership.findUnique({
    where: { tenantId_userId: { tenantId: input.tenantId, userId: input.userId } },
  });
  if (existing) {
    if (!existing.defaultUnitId) {
      return prisma.membership.update({
        where: { id: existing.id },
        data: { defaultUnitId: input.defaultUnitId, active: true },
      });
    }
    return existing;
  }
  return prisma.membership.create({
    data: {
      id: idGenerator.next(),
      tenantId: input.tenantId,
      userId: input.userId,
      role: input.role,
      defaultUnitId: input.defaultUnitId,
      permissions: {},
      active: true,
    },
  });
}

async function ensureTenant(prisma: PrismaClient, passwordHash: string) {
  const existingOwner = await prisma.user.findUnique({
    where: { email: OWNER_EMAIL },
    include: { memberships: { where: { role: Role.OWNER }, take: 1 } },
  });

  if (existingOwner?.memberships[0]) {
    const membership = existingOwner.memberships[0];
    const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: membership.tenantId } });
    console.info(`seed: reusando tenant ${tenant.slug} (${OWNER_EMAIL})`);
    return { tenant, owner: existingOwner, ownerMembership: membership };
  }

  const { getKeyManagement } = await import('../src/shared/crypto/index.js');
  const kms = getKeyManagement();
  const tenantId = idGenerator.next();
  const userId = idGenerator.next();
  const membershipId = idGenerator.next();
  const wrappedDek = await kms.wrapDek(kms.generateDek());

  const tenant = await prisma.tenant.create({
    data: {
      id: tenantId,
      name: CLINIC_NAME,
      slug: buildTenantSlug(CLINIC_NAME, tenantId),
      status: 'TRIAL',
      trialEndsAt: addDays(new Date(), 14),
    },
  });

  await prisma.tenantCryptoKey.create({
    data: {
      id: idGenerator.next(),
      tenantId,
      keyVersion: 1,
      wrappedDek,
      kekProvider: 'local_vps',
      status: 'ACTIVE',
    },
  });

  const owner = await prisma.user.create({
    data: {
      id: userId,
      email: OWNER_EMAIL,
      name: OWNER_NAME,
      passwordHash,
    },
  });

  const ownerMembership = await prisma.membership.create({
    data: {
      id: membershipId,
      tenantId,
      userId,
      role: Role.OWNER,
      permissions: {},
    },
  });

  console.info(`seed: criado tenant ${tenant.slug}`);
  return { tenant, owner, ownerMembership };
}

async function ensureClinic(prisma: PrismaClient, tenantId: string) {
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

async function ensureTeam(
  prisma: PrismaClient,
  input: { tenantId: string; unitId: string; ownerMembershipId: string; passwordHash: string },
) {
  const dentistUser = await upsertUser(prisma, {
    email: DENTIST_EMAIL,
    name: 'Dra. Ana Souza',
    passwordHash: input.passwordHash,
  });
  const receptionUser = await upsertUser(prisma, {
    email: RECEPTION_EMAIL,
    name: 'Carla Recepção',
    passwordHash: input.passwordHash,
  });

  const dentistMembership = await upsertMembership(prisma, {
    tenantId: input.tenantId,
    userId: dentistUser.id,
    role: Role.DENTIST,
    defaultUnitId: input.unitId,
  });
  await upsertMembership(prisma, {
    tenantId: input.tenantId,
    userId: receptionUser.id,
    role: Role.RECEPTION,
    defaultUnitId: input.unitId,
  });

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
    (await prisma.professional.findUnique({ where: { membershipId: dentistMembership.id } })) ??
    (await prisma.professional.create({
      data: {
        id: idGenerator.next(),
        tenantId: input.tenantId,
        membershipId: dentistMembership.id,
        croNumber: '67890',
        croState: 'SP',
        specialties: ['Endodontia', 'Cirurgia'],
        color: '#448361',
        active: true,
      },
    }));

  const inviteExists = await prisma.invitation.findFirst({
    where: { tenantId: input.tenantId, email: INVITE_EMAIL, revokedAt: null, acceptedAt: null },
  });
  if (!inviteExists) {
    const ownerUser = await prisma.membership.findUniqueOrThrow({
      where: { id: input.ownerMembershipId },
      select: { userId: true },
    });
    await prisma.invitation.create({
      data: {
        id: idGenerator.next(),
        tenantId: input.tenantId,
        email: INVITE_EMAIL,
        role: Role.ASSISTANT,
        tokenHash: hashToken(INVITE_RAW_TOKEN),
        invitedByUserId: ownerUser.userId,
        expiresAt: addDays(new Date(), 7),
      },
    });
  }

  return { ownerProfessional, dentistProfessional };
}

async function ensureChairs(prisma: PrismaClient, tenantId: string, unitId: string) {
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

async function ensurePatients(prisma: PrismaClient, tenantId: string, unitId: string) {
  const specs = [
    {
      phone: '11988880001',
      name: 'Maria Silva',
      socialName: null as string | null,
      cpf: '39053344705',
      birthDate: '1988-03-12',
      sex: 'F',
      email: 'maria.silva@teste.local',
      howFoundUs: 'Indicação',
      notes: 'Paciente regular — profilaxia semestral.',
      guardian: null as null | {
        name: string;
        relationship: string;
        phone: string;
        cpf: string;
      },
    },
    {
      phone: '11988880002',
      name: 'João Pedro Almeida',
      socialName: null,
      cpf: '52998224725',
      birthDate: '2014-07-22',
      sex: 'M',
      email: null,
      howFoundUs: 'Instagram',
      notes: 'Menor — responsável acompanha.',
      guardian: {
        name: 'Ana Almeida',
        relationship: 'Mãe',
        phone: '11988880020',
        cpf: '15350946056',
      },
    },
    {
      phone: '11988880003',
      name: 'Carla Mendes',
      socialName: 'Carla M.',
      cpf: '84716938008',
      birthDate: '1995-11-03',
      sex: 'F',
      email: 'carla.mendes@teste.local',
      howFoundUs: 'Google',
      notes: 'Sensibilidade em molares superiores.',
      guardian: null,
    },
    {
      phone: '11988880004',
      name: 'Pedro Oliveira',
      socialName: null,
      cpf: '07312960735',
      birthDate: '1976-01-30',
      sex: 'M',
      email: 'pedro.oliveira@teste.local',
      howFoundUs: 'WhatsApp',
      notes: null,
      guardian: null,
    },
  ];

  const patients = [];
  for (const spec of specs) {
    let patient = await prisma.patient.findFirst({
      where: { tenantId, phonePrimary: spec.phone },
    });
    if (!patient) {
      const counter = await prisma.patientCodeCounter.upsert({
        where: { tenantId },
        create: { tenantId, lastCode: 1n },
        update: { lastCode: { increment: 1 } },
      });
      patient = await prisma.patient.create({
        data: {
          id: idGenerator.next(),
          tenantId,
          unitId,
          code: counter.lastCode,
          name: spec.name,
          socialName: spec.socialName,
          cpf: spec.cpf,
          birthDate: spec.birthDate ? new Date(`${spec.birthDate}T00:00:00.000Z`) : null,
          sex: spec.sex,
          phonePrimary: spec.phone,
          email: spec.email,
          howFoundUs: spec.howFoundUs,
          notes: spec.notes,
          address: {
            street: 'Rua das Acácias',
            number: '120',
            city: 'São Paulo',
            state: 'SP',
            postalCode: '01415000',
          },
          active: true,
        },
      });
    }
    patients.push(patient);

    if (spec.guardian) {
      const guardianExists = await prisma.legalGuardian.findFirst({
        where: { tenantId, patientId: patient.id, cpf: spec.guardian.cpf },
      });
      if (!guardianExists) {
        await prisma.legalGuardian.create({
          data: {
            id: idGenerator.next(),
            tenantId,
            patientId: patient.id,
            name: spec.guardian.name,
            cpf: spec.guardian.cpf,
            relationship: spec.guardian.relationship,
            phone: spec.guardian.phone,
          },
        });
      }
    }

    for (const type of ['DATA_PROCESSING', 'TERMS'] as const) {
      const consentExists = await prisma.consent.findFirst({
        where: { tenantId, patientId: patient.id, type, revokedAt: null },
      });
      if (!consentExists) {
        await prisma.consent.create({
          data: {
            id: idGenerator.next(),
            tenantId,
            patientId: patient.id,
            type,
            granted: true,
            documentVersion: 'v1',
            channel: 'IN_PERSON',
          },
        });
      }
    }
  }

  return patients;
}

async function ensureAnamnesisForm(prisma: PrismaClient, tenantId: string) {
  const existing = await prisma.anamnesisForm.findFirst({
    where: { tenantId, name: 'Anamnese Geral' },
  });
  if (existing) return;
  await prisma.anamnesisForm.create({
    data: {
      id: idGenerator.next(),
      tenantId,
      name: 'Anamnese Geral',
      version: 1,
      active: true,
      questions: [
        {
          id: 'allergy_meds',
          label: 'Possui alergia a medicamentos?',
          type: 'BOOLEAN_WITH_TEXT',
          alertWhen: { equals: true },
          alertSeverity: 'CRITICAL',
          alertCategory: 'ALLERGY',
        },
        {
          id: 'anticoagulant',
          label: 'Usa anticoagulante?',
          type: 'BOOLEAN_WITH_TEXT',
          alertWhen: { equals: true },
          alertSeverity: 'CRITICAL',
          alertCategory: 'MEDICATION',
        },
        {
          id: 'diabetes',
          label: 'É diabético?',
          type: 'SINGLE_CHOICE',
          options: ['Não', 'Tipo 1', 'Tipo 2', 'Gestacional'],
          alertWhen: { notEquals: 'Não' },
          alertSeverity: 'WARNING',
          alertCategory: 'CONDITION',
        },
        {
          id: 'pregnant',
          label: 'Está gestante?',
          type: 'BOOLEAN',
          showWhen: { patientGender: 'F' },
          alertWhen: { equals: true },
          alertSeverity: 'CRITICAL',
        },
        {
          id: 'hypertension',
          label: 'Tem pressão alta?',
          type: 'BOOLEAN_WITH_TEXT',
          alertWhen: { equals: true },
          alertSeverity: 'WARNING',
        },
        {
          id: 'cardiac',
          label: 'Problema cardíaco?',
          type: 'BOOLEAN_WITH_TEXT',
          alertWhen: { equals: true },
          alertSeverity: 'CRITICAL',
        },
        {
          id: 'smoker',
          label: 'Fumante?',
          type: 'SINGLE_CHOICE',
          options: ['Não', 'Sim', 'Ex-fumante'],
        },
        {
          id: 'anesthesia_reaction',
          label: 'Já teve reação a anestesia?',
          type: 'BOOLEAN_WITH_TEXT',
          alertWhen: { equals: true },
          alertSeverity: 'CRITICAL',
        },
        {
          id: 'bleeding',
          label: 'Sangramento excessivo em extrações?',
          type: 'BOOLEAN_WITH_TEXT',
          alertWhen: { equals: true },
          alertSeverity: 'WARNING',
        },
        { id: 'current_meds', label: 'Medicamentos em uso', type: 'TEXT' },
        { id: 'main_complaint', label: 'Queixa principal', type: 'TEXT', required: true },
      ],
    },
  });
}

async function ensureMedicalRecords(
  prisma: PrismaClient,
  tenantId: string,
  patientIds: string[],
) {
  for (const patientId of patientIds) {
    const existing = await prisma.medicalRecord.findUnique({
      where: { tenantId_patientId: { tenantId, patientId } },
    });
    if (existing) continue;
    await prisma.medicalRecord.create({
      data: {
        id: idGenerator.next(),
        tenantId,
        patientId,
      },
    });
  }
}

async function ensureScheduling(
  prisma: PrismaClient,
  input: {
    tenantId: string;
    unitId: string;
    ownerProfessionalId: string;
    dentistProfessionalId: string;
    chair1Id: string;
    chair2Id: string;
    patientIds: string[];
    ownerUserId: string;
  },
) {
  const consult = await prisma.procedure.findUnique({
    where: { tenantId_code: { tenantId: input.tenantId, code: 'CONS-01' } },
  });
  const prophylaxis = await prisma.procedure.findUnique({
    where: { tenantId_code: { tenantId: input.tenantId, code: 'PROF-01' } },
  });
  const restoration = await prisma.procedure.findUnique({
    where: { tenantId_code: { tenantId: input.tenantId, code: 'RES-01' } },
  });

  const slots = [
    {
      key: 'seed:today-0900',
      patientId: input.patientIds[0]!,
      professionalId: input.ownerProfessionalId,
      chairId: input.chair1Id,
      procedureId: consult?.id ?? null,
      startsAt: spDateTime(0, 9),
      endsAt: spDateTime(0, 9, 30),
      status: 'SCHEDULED',
      notes: '[seed] Avaliação inicial',
    },
    {
      key: 'seed:today-1000',
      patientId: input.patientIds[1]!,
      professionalId: input.dentistProfessionalId,
      chairId: input.chair2Id,
      procedureId: prophylaxis?.id ?? null,
      startsAt: spDateTime(0, 10),
      endsAt: spDateTime(0, 10, 40),
      status: 'CONFIRMED',
      notes: '[seed] Profilaxia',
    },
    {
      key: 'seed:today-1400',
      patientId: input.patientIds[2]!,
      professionalId: input.ownerProfessionalId,
      chairId: input.chair1Id,
      procedureId: restoration?.id ?? null,
      startsAt: spDateTime(0, 14),
      endsAt: spDateTime(0, 15),
      status: 'IN_SERVICE',
      notes: '[seed] Restauração em andamento',
    },
    {
      key: 'seed:tomorrow-0900',
      patientId: input.patientIds[3]!,
      professionalId: input.dentistProfessionalId,
      chairId: input.chair2Id,
      procedureId: consult?.id ?? null,
      startsAt: spDateTime(1, 9),
      endsAt: spDateTime(1, 9, 30),
      status: 'SCHEDULED',
      notes: '[seed] Retorno',
    },
    {
      key: 'seed:yesterday-1600',
      patientId: input.patientIds[0]!,
      professionalId: input.ownerProfessionalId,
      chairId: input.chair1Id,
      procedureId: prophylaxis?.id ?? null,
      startsAt: spDateTime(-1, 16),
      endsAt: spDateTime(-1, 16, 40),
      status: 'COMPLETED',
      notes: '[seed] Concluído',
    },
    {
      key: 'seed:yesterday-1100',
      patientId: input.patientIds[2]!,
      professionalId: input.dentistProfessionalId,
      chairId: input.chair2Id,
      procedureId: consult?.id ?? null,
      startsAt: spDateTime(-1, 11),
      endsAt: spDateTime(-1, 11, 30),
      status: 'CANCELLED',
      notes: '[seed] Paciente desmarcou',
    },
  ];

  for (const slot of slots) {
    const existing = await prisma.appointment.findFirst({
      where: { tenantId: input.tenantId, idempotencyKey: slot.key },
    });
    if (existing) {
      await prisma.appointment.update({
        where: { id: existing.id },
        data: {
          startsAt: slot.startsAt,
          endsAt: slot.endsAt,
          status: slot.status,
          confirmedAt: slot.status === 'CONFIRMED' || slot.status === 'IN_SERVICE' ? slot.startsAt : null,
          arrivedAt: slot.status === 'IN_SERVICE' ? slot.startsAt : null,
          cancelledAt: slot.status === 'CANCELLED' ? slot.startsAt : null,
        },
      });
      continue;
    }

    const appointment = await prisma.appointment.create({
      data: {
        id: idGenerator.next(),
        tenantId: input.tenantId,
        unitId: input.unitId,
        patientId: slot.patientId,
        professionalId: slot.professionalId,
        chairId: slot.chairId,
        procedureId: slot.procedureId,
        startsAt: slot.startsAt,
        endsAt: slot.endsAt,
        status: slot.status,
        origin: 'INTERNAL',
        notes: slot.notes,
        idempotencyKey: slot.key,
        createdBy: input.ownerUserId,
        confirmedAt: slot.status === 'CONFIRMED' || slot.status === 'IN_SERVICE' ? slot.startsAt : null,
        arrivedAt: slot.status === 'IN_SERVICE' ? slot.startsAt : null,
        cancelledAt: slot.status === 'CANCELLED' ? slot.startsAt : null,
        cancelReason: slot.status === 'CANCELLED' ? 'Paciente desmarcou' : null,
      },
    });

    await prisma.appointmentHistory.create({
      data: {
        id: idGenerator.next(),
        tenantId: input.tenantId,
        appointmentId: appointment.id,
        action: slot.status === 'CANCELLED' ? 'CANCELLED' : 'CREATED',
        actorId: input.ownerUserId,
        actorType: 'USER',
        toValue: { status: slot.status },
      },
    });
  }

  const lunchExists = await prisma.scheduleBlock.findFirst({
    where: {
      tenantId: input.tenantId,
      professionalId: input.ownerProfessionalId,
      reason: '[seed] Almoço',
    },
  });
  if (!lunchExists) {
    await prisma.scheduleBlock.create({
      data: {
        id: idGenerator.next(),
        tenantId: input.tenantId,
        unitId: input.unitId,
        professionalId: input.ownerProfessionalId,
        startsAt: spDateTime(0, 12),
        endsAt: spDateTime(0, 13),
        reason: '[seed] Almoço',
      },
    });
  }
}

async function ensureMessaging(prisma: PrismaClient, tenantId: string) {
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

async function main() {
  const url = process.env.DATABASE_MIGRATION_URL ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_MIGRATION_URL ou DATABASE_URL é obrigatório para seed.');
  }

  const prisma = new PrismaClient({ datasources: { db: { url } } });
  const passwordHash = await hashPassword(SEED_PASSWORD);

  try {
    const { tenant, owner, ownerMembership } = await ensureTenant(prisma, passwordHash);
    const unit = await ensureClinic(prisma, tenant.id);
    await prisma.membership.update({
      where: { id: ownerMembership.id },
      data: { defaultUnitId: unit.id },
    });

    const { ownerProfessional, dentistProfessional } = await ensureTeam(prisma, {
      tenantId: tenant.id,
      unitId: unit.id,
      ownerMembershipId: ownerMembership.id,
      passwordHash,
    });
    const chairs = await ensureChairs(prisma, tenant.id, unit.id);
    const patients = await ensurePatients(prisma, tenant.id, unit.id);
    await ensureMedicalRecords(prisma, tenant.id, patients.map((p) => p.id));
    await ensureAnamnesisForm(prisma, tenant.id);
    await ensureScheduling(prisma, {
      tenantId: tenant.id,
      unitId: unit.id,
      ownerProfessionalId: ownerProfessional.id,
      dentistProfessionalId: dentistProfessional.id,
      chair1Id: chairs[0]!.id,
      chair2Id: chairs[1]!.id,
      patientIds: patients.map((patient) => patient.id),
      ownerUserId: owner.id,
    });
    await ensureMessaging(prisma, tenant.id);

    console.info('seed: ok');
    console.info(`  login owner     ${OWNER_EMAIL} / ${OWNER_PASSWORD}`);
    console.info(`  login dentista  ${DENTIST_EMAIL} / ${SEED_PASSWORD}`);
    console.info(`  login recepção  ${RECEPTION_EMAIL} / ${SEED_PASSWORD}`);
    console.info(`  convite pendente ${INVITE_EMAIL} (token dev: ${INVITE_RAW_TOKEN})`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
