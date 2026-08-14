import type { RequestContext } from '../../../shared/domain/request_context.js';
import { getPublicClinicCatalog } from '../../clinic/clinic_public.js';
import { todayInTimezone } from './civil_date.helper.js';

export async function tenantToday(ctx: RequestContext): Promise<string> {
  const catalog = await getPublicClinicCatalog(ctx);
  return todayInTimezone(catalog?.timezone ?? 'America/Sao_Paulo');
}
