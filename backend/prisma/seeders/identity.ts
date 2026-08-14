import type { PrismaClient } from '@prisma/client';
import { Role } from '../../src/modules/identity/enum/role/role.enum.js';
import { addDays, buildTenantSlug } from '../../src/modules/identity/helpers/slug.helper.js';
import { idGenerator } from '../../src/shared/helpers/id_generator.js';
import { hashToken } from '../../src/shared/helpers/token_hash.js';
import {
  CLINIC_NAME,
  DENTIST_EMAIL,
  FINANCE_EMAIL,
  INVITE_EMAIL,
  INVITE_RAW_TOKEN,
  OWNER_EMAIL,
  OWNER_NAME,
  RECEPTION_EMAIL,
  ASSISTANT_EMAIL,
} from './constants.js';

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

export async function seedIdentity(prisma: PrismaClient, passwordHash: string) {
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

  const { getKeyManagement } = await import('../../src/shared/crypto/index.js');
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

export async function seedIdentityTeam(
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
  const assistantUser = await upsertUser(prisma, {
    email: ASSISTANT_EMAIL,
    name: 'ASB Teste',
    passwordHash: input.passwordHash,
  });
  const financeUser = await upsertUser(prisma, {
    email: FINANCE_EMAIL,
    name: 'Financeiro Teste',
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
  await upsertMembership(prisma, {
    tenantId: input.tenantId,
    userId: assistantUser.id,
    role: Role.ASSISTANT,
    defaultUnitId: input.unitId,
  });
  await upsertMembership(prisma, {
    tenantId: input.tenantId,
    userId: financeUser.id,
    role: Role.FINANCE,
    defaultUnitId: input.unitId,
  });

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

  return { dentistMembership };
}
