import type { RequestContext } from '../../../shared/domain/request_context.js';
import { getProfessionalByMembershipId } from '../../clinic/clinic_public.js';
import { ReportScopeForbiddenError } from '../models/errors/reporting.errors.js';

export function hasFinancialReports(ctx: RequestContext): boolean {
  return (ctx.permissions ?? []).includes('reports.financial');
}

/** DENTIST: força o próprio profissional; outro id → 403. */
export async function resolveProfessionalScope(
  ctx: RequestContext,
  requestedProfessionalId?: string,
): Promise<string | undefined> {
  if (ctx.role !== 'DENTIST') return requestedProfessionalId;
  if (!ctx.membershipId) throw new ReportScopeForbiddenError();
  const mine = await getProfessionalByMembershipId(ctx, ctx.membershipId);
  if (!mine) throw new ReportScopeForbiddenError();
  if (requestedProfessionalId && requestedProfessionalId !== mine.id) {
    throw new ReportScopeForbiddenError();
  }
  return mine.id;
}
