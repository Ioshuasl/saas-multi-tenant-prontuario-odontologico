import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getWahaSessionPort } from '../../../../shared/integrations/whatsapp/index.js';
import type { AccountConnectSchema } from '../../schemas/messaging.schema.js';
import type { WhatsappAccountSummary } from '../../types/messaging.types.js';
import { wahaSessionName } from '../../helpers/waha_session.helper.js';
import {
  UpdateAccountRepository,
  UpsertAccountRepository,
} from '../../repositories/whatsapp_account/whatsapp_account.repository.js';

function sessionLooksConnected(status: string): boolean {
  return status === 'WORKING' || status === 'CONNECTED';
}

export class ConnectAction {
  constructor(
    private readonly upsert = new UpsertAccountRepository(),
    private readonly update = new UpdateAccountRepository(),
    private readonly waha = getWahaSessionPort(),
  ) {}

  async execute(ctx: RequestContext, accountSchema: AccountConnectSchema): Promise<WhatsappAccountSummary> {
    const sessionName = wahaSessionName(ctx.tenantId);
    const summary = await this.upsert.execute(ctx, {
      sessionName,
      riskAcceptedAt: new Date(),
      unitId: accountSchema.unitId ?? null,
      status: 'PENDING',
      lastError: null,
    });
    await this.waha.ensureSession(sessionName);
    const live = await this.waha.getQr(sessionName);
    if (live.displayPhone) {
      await this.update.execute(ctx, { displayPhone: live.displayPhone });
    }
    if (!sessionLooksConnected(live.status)) return summary;
    const connected = await this.update.execute(ctx, {
      status: 'CONNECTED',
      lastError: null,
      webhookVerifiedAt: new Date(),
      displayPhone: live.displayPhone,
    });
    return connected ?? summary;
  }
}
