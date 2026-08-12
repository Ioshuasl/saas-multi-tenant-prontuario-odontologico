import type { DbTransaction } from '../../../../shared/database/db_transaction.js';

export type SignupProvisionInput = {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  trialEndsAt: Date;
  userId: string;
  userEmail: string;
  userName: string;
  passwordHash: string;
  membershipId: string;
  membershipRole: string;
  cryptoKeyId: string;
  wrappedDek: string;
};

export class SignupProvisionRepository {
  /** Cria o tenant sob flag de provisioning (antes de setar app.tenant_id). */
  async createTenant(tx: DbTransaction, input: SignupProvisionInput): Promise<void> {
    await tx.tenant.create({
      data: {
        id: input.tenantId,
        name: input.tenantName,
        slug: input.tenantSlug,
        status: 'TRIAL',
        trialEndsAt: input.trialEndsAt,
      },
    });
  }

  /**
   * DEK + user + membership — exige `app.tenant_id` já setado (RLS em crypto/membership).
   */
  async createOwnerArtifacts(tx: DbTransaction, input: SignupProvisionInput): Promise<void> {
    await tx.tenantCryptoKey.create({
      data: {
        id: input.cryptoKeyId,
        tenantId: input.tenantId,
        keyVersion: 1,
        wrappedDek: input.wrappedDek,
        kekProvider: 'local_vps',
        status: 'ACTIVE',
      },
    });

    await tx.user.create({
      data: {
        id: input.userId,
        email: input.userEmail,
        passwordHash: input.passwordHash,
        name: input.userName,
      },
    });

    await tx.membership.create({
      data: {
        id: input.membershipId,
        tenantId: input.tenantId,
        userId: input.userId,
        role: input.membershipRole,
        permissions: {},
      },
    });
  }
}
