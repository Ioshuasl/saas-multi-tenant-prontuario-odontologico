import type { DbTransaction } from '../../../../shared/database/db_transaction.js';

export type ClinicOnboardingSeedInput = {
  tenantId: string;
  clinicName: string;
  idNext: () => string;
};

export type ClinicOnboardingSeedResult = {
  unitId: string;
};

export type ClinicOnboardingPort = {
  seedClinicOnSignup(
    tx: DbTransaction,
    input: ClinicOnboardingSeedInput,
  ): Promise<ClinicOnboardingSeedResult>;
};
