import { getKeyManagement } from '../../../../shared/crypto/index.js';
import type { IdGenerator } from '../../../../shared/helpers/id_generator.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import { hashPassword } from '../../../../shared/helpers/password.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { seedClinicOnSignup } from '../../../clinic/clinic_public.js';
import { seedMessagingOnSignup } from '../../../messaging/messaging_public.js';
import { seedDefaultAnamnesisForm } from '../../../clinical_records/clinical_records_public.js';
import { Role } from '../../enum/role/role.enum.js';
import { addDays, buildTenantSlug } from '../../helpers/slug.helper.js';
import { SignupProvisionRepository } from '../../repositories/signup/signup_provision.repository.js';
import type { SignupActionResult } from '../../types/auth.types.js';

export type SignupActionInput = {
  email: string;
  password: string;
  clinicName: string;
  ownerName: string;
};

export class CreateAction {
  constructor(
    private readonly ids: IdGenerator = idGenerator,
    private readonly tenantPrisma = getTenantPrisma(),
    private readonly signupProvision = new SignupProvisionRepository(),
    private readonly kms = getKeyManagement(),
  ) {}

  async execute(input: SignupActionInput): Promise<SignupActionResult> {
    const tenantId = this.ids.next();
    const userId = this.ids.next();
    const membershipId = this.ids.next();
    const cryptoKeyId = this.ids.next();
    const tenantSlug = buildTenantSlug(input.clinicName, tenantId);
    const trialEndsAt = addDays(new Date(), 14);
    const passwordHash = await hashPassword(input.password);
    const dek = this.kms.generateDek();
    const wrappedDek = await this.kms.wrapDek(dek);

    const provision = {
      tenantId,
      tenantName: input.clinicName,
      tenantSlug,
      trialEndsAt,
      userId,
      userEmail: input.email.toLowerCase(),
      userName: input.ownerName,
      passwordHash,
      membershipId,
      membershipRole: Role.OWNER,
      cryptoKeyId,
      wrappedDek,
    };

    await this.tenantPrisma.runProvisioning(async (tx) => {
      await this.signupProvision.createTenant(tx, provision);
      await this.tenantPrisma.setTenantId(tx, tenantId);
      await this.signupProvision.createOwnerArtifacts(tx, provision);

      const { unitId } = await seedClinicOnSignup(tx, {
        tenantId,
        clinicName: input.clinicName,
        idNext: () => this.ids.next(),
      });

      await seedMessagingOnSignup(tx, {
        tenantId,
        idNext: () => this.ids.next(),
      });

      await seedDefaultAnamnesisForm(tx, {
        tenantId,
        idNext: () => this.ids.next(),
      });

      await tx.membership.update({
        where: { id: membershipId },
        data: { defaultUnitId: unitId },
      });
    });

    return {
      tenantId,
      userId,
      membershipId,
      tenantName: input.clinicName,
      tenantSlug,
      userEmail: input.email.toLowerCase(),
      userName: input.ownerName,
      role: Role.OWNER,
    };
  }
}
