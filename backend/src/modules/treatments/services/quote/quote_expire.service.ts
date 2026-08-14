import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { UnitOfWork } from '../../../../shared/database/unit_of_work.js';
import { getPublicClinicCatalog } from '../../../clinic/clinic_public.js';
import { todayInTimezone } from '../../helpers/quote_valid_until.helper.js';
import {
  ExpireManyRepository,
  ListSentDueRepository,
} from '../../repositories/quote/quote_expire.repository.js';

export class ExpireService {
  constructor(
    private readonly listDue = new ListSentDueRepository(),
    private readonly expireMany = new ExpireManyRepository(),
    private readonly uow = new UnitOfWork(),
  ) {}

  async execute(ctx: RequestContext): Promise<number> {
    const catalog = await getPublicClinicCatalog(ctx);
    const timezone = catalog?.timezone ?? 'America/Sao_Paulo';
    const today = todayInTimezone(timezone);
    const ids = await this.listDue.execute(ctx, today);
    if (ids.length === 0) return 0;

    return this.uow.run(ctx, async ({ tx, publish }) => {
      const count = await this.expireMany.executeInTx(tx, ids);
      publish(
        ids.map((quoteId) => ({
          name: 'treatments.quote_expired',
          payload: { quoteId, requestId: ctx.requestId },
        })),
      );
      return count;
    });
  }
}
