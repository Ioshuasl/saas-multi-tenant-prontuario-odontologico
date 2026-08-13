import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { GetCreditBalanceRepository, GetTenantMessagingContextRepository } from '../../repositories/credit/credit.repository.js';
import type { MessagingUsage } from '../../types/messaging.types.js';

const LOW_THRESHOLD = 10;

export class GetService {
  constructor(
    private readonly balance = new GetCreditBalanceRepository(),
    private readonly tenantCtx = new GetTenantMessagingContextRepository(),
  ) {}

  async execute(ctx: RequestContext): Promise<MessagingUsage> {
    const [credits, tenant] = await Promise.all([
      this.balance.execute(ctx),
      this.tenantCtx.execute(ctx),
    ]);
    return {
      courtesyGranted: tenant.courtesyTransactionalMessages,
      balance: credits.balance,
      consumed: credits.consumed,
      lowThreshold: LOW_THRESHOLD,
      creditsLow: credits.balance > 0 && credits.balance <= LOW_THRESHOLD,
      creditsExhausted: credits.balance <= 0,
    };
  }
}
