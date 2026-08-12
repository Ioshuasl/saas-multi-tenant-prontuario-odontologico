import { getPrismaClient } from '../../../../shared/database/tenant_prisma.js';

export type RefreshTokenRow = {
  id: string;
  userId: string;
  membershipId: string | null;
  familyId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedById: string | null;
};

export class CreateRepository {
  async execute(input: {
    id: string;
    userId: string;
    membershipId?: string;
    familyId: string;
    tokenHash: string;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    const prisma = getPrismaClient();
    await prisma.refreshToken.create({
      data: {
        id: input.id,
        userId: input.userId,
        membershipId: input.membershipId,
        familyId: input.familyId,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });
  }
}

export class GetByHashRepository {
  async execute(tokenHash: string): Promise<RefreshTokenRow | null> {
    const prisma = getPrismaClient();
    return prisma.refreshToken.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        userId: true,
        membershipId: true,
        familyId: true,
        tokenHash: true,
        expiresAt: true,
        revokedAt: true,
        replacedById: true,
      },
    });
  }
}

export class RevokeTokenRepository {
  async execute(tokenId: string, replacedById?: string): Promise<void> {
    const prisma = getPrismaClient();
    await prisma.refreshToken.update({
      where: { id: tokenId },
      data: {
        revokedAt: new Date(),
        ...(replacedById ? { replacedById } : {}),
      },
    });
  }
}

export class RevokeFamilyRepository {
  async execute(userId: string, familyId: string): Promise<void> {
    const prisma = getPrismaClient();
    await prisma.refreshToken.updateMany({
      where: { userId, familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}

export class RevokeAllFamiliesRepository {
  async execute(userId: string): Promise<void> {
    const prisma = getPrismaClient();
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
