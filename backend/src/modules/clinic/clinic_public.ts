import type { DbTransaction } from '../../shared/database/db_transaction.js';
import { OnboardingSeedRepository } from './repositories/onboarding/onboarding_seed.repository.js';
import { GetService as WorkingWindowsGetService } from './services/business_hours/working_windows_get.service.js';
import type {
  ClinicOnboardingSeedInput,
  ClinicOnboardingSeedResult,
} from './types/ports/clinic_onboarding.port.js';
import type { WorkingWindow } from './helpers/working_windows.helper.js';

const onboardingSeedRepository = new OnboardingSeedRepository();
const workingWindowsGet = new WorkingWindowsGetService();

export async function seedClinicOnSignup(
  tx: DbTransaction,
  input: ClinicOnboardingSeedInput,
): Promise<ClinicOnboardingSeedResult> {
  return onboardingSeedRepository.execute(tx, input);
}

export type GetWorkingWindowsInput = {
  tenantId: string;
  unitId: string;
  professionalId?: string;
  /** Data civil YYYY-MM-DD no fuso do tenant. */
  date: string;
};

/** Disponibilidade efetiva (unidade ∩ profissional ∩ exceções) — RF-E2-07. */
export async function getWorkingWindows(
  input: GetWorkingWindowsInput,
): Promise<WorkingWindow[]> {
  return workingWindowsGet.execute(input);
}

export type { ClinicOnboardingPort, ClinicOnboardingSeedInput, ClinicOnboardingSeedResult } from './types/ports/clinic_onboarding.port.js';
export type { WorkingWindow } from './helpers/working_windows.helper.js';
