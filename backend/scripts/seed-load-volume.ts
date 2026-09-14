import { PrismaClient } from '@prisma/client';
import { CreateAction } from '../src/modules/identity/actions/auth/auth_signup.action.js';
import { idGenerator } from '../src/shared/helpers/id_generator.js';

const LOAD_EMAIL = 'carga@teste.local';
const LOAD_PASSWORD = 'SenhaForte!99';
const LOAD_CLINIC = 'Clinica Carga';
const LOAD_OWNER = 'Owner Carga';
const NAME_PREFIX = 'Carga Paciente';
const LOAD_NOTE = '[load]';
const PATIENT_TARGET = 10_000;
const APPOINTMENT_TARGET = 5_000;
const TODAY_TARGET = 200;
const SLOT_MS = 2 * 60_000;
const DAY_START_HOUR = 8;
const HIST_SLOTS_PER_DAY = 240;
const BATCH = 500;
const TIMEZONE = 'America/Sao_Paulo';

function pad(n: number, width = 2): string {
  return String(n).padStart(width, '0');
}

function ymdInSp(date: Date): string {
  return date.toLocaleDateString('en-CA', { timeZone: TIMEZONE });
}

function atSp(ymd: string, hour: number, minute: number): Date {
  return new Date(`${ymd}T${pad(hour)}:${pad(minute)}:00-03:00`);
}

function addCalendarDays(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d + days));
  return `${utc.getUTCFullYear()}-${pad(utc.getUTCMonth() + 1)}-${pad(utc.getUTCDate())}`;
}

function patientName(index: number): string {
  return `${NAME_PREFIX} ${pad(index, 7)}`;
}

function patientPhone(index: number): string {
  return `1199${pad(1_000_000 + index, 7)}`;
}

function overlaps(start: Date, end: Date, occupied: { startsAt: Date; endsAt: Date }[]): boolean {
  return occupied.some((slot) => start < slot.endsAt && end > slot.startsAt);
}

async function createManyInBatches<T>(
  rows: T[],
  insert: (chunk: T[]) => Promise<unknown>,
): Promise<void> {
  for (let i = 0; i < rows.length; i += BATCH) {
    await insert(rows.slice(i, i + BATCH));
    process.stdout.write(`  ${Math.min(i + BATCH, rows.length)}/${rows.length}\n`);
  }
}

async function main(): Promise<void> {
  const url = process.env.DATABASE_MIGRATION_URL ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_MIGRATION_URL ou DATABASE_URL é obrigatório.');
  }
  const prisma = new PrismaClient({ datasources: { db: { url } } });

  try {
    let user = await prisma.user.findUnique({
      where: { email: LOAD_EMAIL },
      include: { memberships: { where: { role: 'OWNER' }, take: 1 } },
    });

    if (!user?.memberships[0]) {
      const created = await new CreateAction().execute({
        email: LOAD_EMAIL,
        password: LOAD_PASSWORD,
        clinicName: LOAD_CLINIC,
        ownerName: LOAD_OWNER,
      });
      user = await prisma.user.findUniqueOrThrow({
        where: { id: created.userId },
        include: { memberships: { where: { role: 'OWNER' }, take: 1 } },
      });
      console.info(`seed-load: tenant criado ${created.tenantId}`);
    } else {
      console.info(`seed-load: reusando ${LOAD_EMAIL}`);
    }

    const membership = user.memberships[0];
    if (!membership) throw new Error('membership OWNER ausente');
    const tenantId = membership.tenantId;
    const unit =
      (await prisma.unit.findFirst({ where: { tenantId, isDefault: true } })) ??
      (await prisma.unit.findFirstOrThrow({ where: { tenantId } }));

    const professional =
      (await prisma.professional.findUnique({ where: { membershipId: membership.id } })) ??
      (await prisma.professional.create({
        data: {
          id: idGenerator.next(),
          tenantId,
          membershipId: membership.id,
          croNumber: '99999',
          croState: 'SP',
          specialties: ['Clínica geral'],
          color: '#0B6E99',
          active: true,
        },
      }));

    const existingPatients = await prisma.patient.count({
      where: { tenantId, name: { startsWith: NAME_PREFIX } },
    });
    const missingPatients = Math.max(0, PATIENT_TARGET - existingPatients);
    if (missingPatients > 0) {
      const counter = await prisma.patientCodeCounter.findUnique({ where: { tenantId } });
      let nextCode = Number(counter?.lastCode ?? 0n) + 1;
      const startIndex = existingPatients + 1;
      const rows = Array.from({ length: missingPatients }, (_, offset) => {
        const index = startIndex + offset;
        const code = nextCode;
        nextCode += 1;
        return {
          id: idGenerator.next(),
          tenantId,
          unitId: unit.id,
          code: BigInt(code),
          name: patientName(index),
          phonePrimary: patientPhone(index),
          origin: 'INTERNAL',
          active: true,
        };
      });
      console.info(`seed-load: pacientes +${missingPatients}`);
      await createManyInBatches(rows, (chunk) => prisma.patient.createMany({ data: chunk }));
      await prisma.patientCodeCounter.upsert({
        where: { tenantId },
        create: { tenantId, lastCode: BigInt(nextCode - 1) },
        update: { lastCode: BigInt(nextCode - 1) },
      });
    } else {
      console.info(`seed-load: pacientes já em ${existingPatients}`);
    }

    const patients = await prisma.patient.findMany({
      where: { tenantId, name: { startsWith: NAME_PREFIX } },
      select: { id: true },
      orderBy: { code: 'asc' },
    });
    if (patients.length < PATIENT_TARGET) {
      throw new Error(`esperava ≥ ${PATIENT_TARGET} pacientes de carga`);
    }

    const occupied = await prisma.appointment.findMany({
      where: {
        tenantId,
        professionalId: professional.id,
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      },
      select: { startsAt: true, endsAt: true },
    });

    const todayYmd = ymdInSp(new Date());
    const todayStart = atSp(todayYmd, 0, 0);
    const tomorrowStart = atSp(addCalendarDays(todayYmd, 1), 0, 0);
    const todayExisting = await prisma.appointment.count({
      where: {
        tenantId,
        notes: LOAD_NOTE,
        startsAt: { gte: todayStart, lt: tomorrowStart },
      },
    });
    const loadExisting = await prisma.appointment.count({
      where: { tenantId, notes: LOAD_NOTE },
    });

    const toCreate: {
      id: string;
      tenantId: string;
      unitId: string;
      patientId: string;
      professionalId: string;
      startsAt: Date;
      endsAt: Date;
      status: string;
      origin: string;
      notes: string;
    }[] = [];

    const pushSlot = (startsAt: Date, endsAt: Date): void => {
      if (overlaps(startsAt, endsAt, occupied)) return;
      occupied.push({ startsAt, endsAt });
      const patient = patients[toCreate.length % patients.length];
      if (!patient) return;
      toCreate.push({
        id: idGenerator.next(),
        tenantId,
        unitId: unit.id,
        patientId: patient.id,
        professionalId: professional.id,
        startsAt,
        endsAt,
        status: 'SCHEDULED',
        origin: 'INTERNAL',
        notes: LOAD_NOTE,
      });
    };

    const todayMissing = Math.max(0, TODAY_TARGET - todayExisting);
    let todayAdded = 0;
    for (let i = 0; todayAdded < todayMissing; i += 1) {
      const startsAt = new Date(atSp(todayYmd, DAY_START_HOUR, 0).getTime() + i * SLOT_MS);
      if (startsAt >= tomorrowStart) break;
      const before = toCreate.length;
      pushSlot(startsAt, new Date(startsAt.getTime() + SLOT_MS));
      if (toCreate.length > before) todayAdded += 1;
    }

    const stillNeeded = Math.max(0, APPOINTMENT_TARGET - loadExisting - toCreate.length);
    let dayOffset = 1;
    let histAdded = 0;
    while (histAdded < stillNeeded && dayOffset <= 40) {
      const ymd = addCalendarDays(todayYmd, -dayOffset);
      const dayStart = atSp(ymd, DAY_START_HOUR, 0);
      for (let i = 0; i < HIST_SLOTS_PER_DAY && histAdded < stillNeeded; i += 1) {
        const startsAt = new Date(dayStart.getTime() + i * SLOT_MS);
        const before = toCreate.length;
        pushSlot(startsAt, new Date(startsAt.getTime() + SLOT_MS));
        if (toCreate.length > before) histAdded += 1;
      }
      dayOffset += 1;
    }

    if (toCreate.length > 0) {
      console.info(`seed-load: appointments +${toCreate.length}`);
      await createManyInBatches(toCreate, (chunk) => prisma.appointment.createMany({ data: chunk }));
    } else {
      console.info('seed-load: appointments já no alvo');
    }

    const patientCount = await prisma.patient.count({
      where: { tenantId, name: { startsWith: NAME_PREFIX } },
    });
    const appointmentCount = await prisma.appointment.count({
      where: { tenantId, notes: LOAD_NOTE },
    });
    const todayCount = await prisma.appointment.count({
      where: {
        tenantId,
        notes: LOAD_NOTE,
        startsAt: { gte: todayStart, lt: tomorrowStart },
      },
    });

    console.info('seed-load: ok');
    console.info(`  LOAD_EMAIL=${LOAD_EMAIL}`);
    console.info(`  LOAD_PASSWORD=${LOAD_PASSWORD}`);
    console.info(`  TENANT_ID=${tenantId}`);
    console.info(`  TODAY=${todayYmd}`);
    console.info(`  SEARCH=${patientName(1)}`);
    console.info(`  patients=${patientCount} appointments=${appointmentCount} today=${todayCount}`);
    console.info(`  agenda from=${todayStart.toISOString()} to=${tomorrowStart.toISOString()}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
