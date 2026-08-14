import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { ChargeAction } from '../../actions/installment/installment_charge.action.js';
import type { InstallmentChargeSchema } from '../../schemas/billing.schema.js';
import type { ChargeResult } from '../../types/installment/installment_charge.types.js';

export class ChargeService {
  constructor(private readonly charge = new ChargeAction()) {}

  execute(
    ctx: RequestContext,
    installmentId: string,
    installmentChargeSchema: InstallmentChargeSchema,
  ): Promise<ChargeResult> {
    return this.charge.execute(ctx, installmentId, installmentChargeSchema);
  }
}
