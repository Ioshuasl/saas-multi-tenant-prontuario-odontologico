import type { RequestContext } from '../../shared/domain/request_context.js';
import { ListByPatientRepository } from './repositories/quote/quote_list_by_patient.repository.js';
import { GetActiveByPatientRepository } from './repositories/treatment_plan/treatment_plan_get_active_by_patient.repository.js';
import type { QuoteTimelineItem } from './types/quote/quote_timeline.types.js';
import type { TreatmentPlanSummary } from './types/treatment_plan/treatment_plan_get.types.js';

const listQuotes = new ListByPatientRepository();
const getActivePlan = new GetActiveByPatientRepository();

export async function listQuotesForTimeline(
  ctx: RequestContext,
  patientId: string,
): Promise<QuoteTimelineItem[]> {
  return listQuotes.execute(ctx, patientId);
}

export async function getActivePlanForPatient(
  ctx: RequestContext,
  patientId: string,
): Promise<TreatmentPlanSummary | null> {
  return getActivePlan.execute(ctx, patientId);
}

export type { QuoteTimelineItem } from './types/quote/quote_timeline.types.js';
export type { TreatmentPlanSummary } from './types/treatment_plan/treatment_plan_get.types.js';
