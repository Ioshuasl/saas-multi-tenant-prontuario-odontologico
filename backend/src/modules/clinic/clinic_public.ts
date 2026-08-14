import type { DbTransaction } from '../../shared/database/db_transaction.js';
import type { RequestContext } from '../../shared/domain/request_context.js';
import { OnboardingSeedRepository } from './repositories/onboarding/onboarding_seed.repository.js';
import { GetService as WorkingWindowsGetService } from './services/business_hours/working_windows_get.service.js';
import { ResolveTenantBySlugRepository } from './repositories/tenant/tenant_resolve_slug.repository.js';
import { GetPublicCatalogRepository } from './repositories/tenant/tenant_public_catalog.repository.js';
import {
  GetByMembershipRepository,
  GetProfessionalRepository,
} from './repositories/professional/professional.repository.js';
import { GetProcedureRepository } from './repositories/procedure/procedure.repository.js';
import {
  GetLetterheadRepository,
  ListTenantsForJobsRepository,
} from './repositories/tenant/tenant_letterhead.repository.js';
import type {
  ClinicOnboardingSeedInput,
  ClinicOnboardingSeedResult,
} from './types/ports/clinic_onboarding.port.js';
import type { WorkingWindow } from './helpers/working_windows.helper.js';
import type { ProfessionalSummary, ProcedureSummary } from './types/clinic.types.js';

const onboardingSeedRepository = new OnboardingSeedRepository();
const workingWindowsGet = new WorkingWindowsGetService();
const resolveSlug = new ResolveTenantBySlugRepository();
const publicCatalog = new GetPublicCatalogRepository();
const getByMembership = new GetByMembershipRepository();
const getProfessional = new GetProfessionalRepository();
const getProcedure = new GetProcedureRepository();
const getLetterhead = new GetLetterheadRepository();
const listTenantsForJobs = new ListTenantsForJobsRepository();

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

export async function resolveTenantIdBySlug(slug: string): Promise<string | null> {
  return resolveSlug.execute(slug);
}

export async function getPublicClinicCatalog(ctx: RequestContext) {
  return publicCatalog.execute(ctx);
}

export async function getProfessionalByMembershipId(
  ctx: RequestContext,
  membershipId: string,
): Promise<ProfessionalSummary | null> {
  return getByMembership.execute(ctx, membershipId);
}

export async function getProfessionalById(
  ctx: RequestContext,
  professionalId: string,
): Promise<ProfessionalSummary | null> {
  return getProfessional.execute(ctx, professionalId);
}

export async function getProcedureById(
  ctx: RequestContext,
  procedureId: string,
): Promise<ProcedureSummary | null> {
  return getProcedure.execute(ctx, procedureId);
}

export async function getClinicLetterhead(ctx: RequestContext, unitId: string) {
  return getLetterhead.execute(ctx, unitId);
}

export async function listTenantsForScheduledJobs() {
  return listTenantsForJobs.execute();
}

export type { ClinicOnboardingPort, ClinicOnboardingSeedInput, ClinicOnboardingSeedResult } from './types/ports/clinic_onboarding.port.js';
export type { WorkingWindow } from './helpers/working_windows.helper.js';
export type { BookingSettings } from './helpers/booking_settings.helper.js';
export type { ProfessionalSummary, ProcedureSummary } from './types/clinic.types.js';
export { parseBookingSettings, DEFAULT_BOOKING_SETTINGS } from './helpers/booking_settings.helper.js';
