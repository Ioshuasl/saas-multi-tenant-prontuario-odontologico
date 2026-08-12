import type { DbTransaction } from '../../../../shared/database/db_transaction.js';
import { getPrismaClient } from '../../../../shared/database/tenant_prisma.js';

export type PasswordResetRow = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
};

export class CreateRepository {
  async execute(input: {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void> {
    const prisma = getPrismaClient();
    await prisma.passwordResetToken.create({
      data: {
        id: input.id,
        userId: input.userId,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
      },
    });
  }
}

export class InvalidateOpenByUserRepository {
  async execute(userId: string): Promise<void> {
    const prisma = getPrismaClient();
    await prisma.passwordResetToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    });
  }
}

export class GetByHashRepository {
  async execute(tokenHash: string): Promise<PasswordResetRow | null> {
    const prisma = getPrismaClient();
    return prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        userId: true,
        tokenHash: true,
        expiresAt: true,
        usedAt: true,
      },
    });
  }
}

export class MarkUsedRepository {
  async execute(tokenId: string, tx?: DbTransaction): Promise<void> {
    const client = tx ?? getPrismaClient();
    await client.passwordResetToken.update({
      where: { id: tokenId },
      data: { usedAt: new Date() },
    });
  }
}
