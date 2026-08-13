import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getKeyManagement } from '../../../../shared/crypto/index.js';
import type { AccountConnectSchema } from '../../schemas/messaging.schema.js';
import type { WhatsappAccountSummary } from '../../types/messaging.types.js';
import { UpsertAccountRepository } from '../../repositories/whatsapp_account/whatsapp_account.repository.js';

export class ConnectAction {
  constructor(
    private readonly upsert = new UpsertAccountRepository(),
    private readonly kms = getKeyManagement(),
  ) {}

  async execute(ctx: RequestContext, accountSchema: AccountConnectSchema): Promise<WhatsappAccountSummary> {
    const accessTokenRef = await this.kms.sealSecret(accountSchema.accessToken);
    return this.upsert.execute(ctx, {
      wabaId: accountSchema.wabaId,
      phoneNumberId: accountSchema.phoneNumberId,
      displayPhone: accountSchema.displayPhone.replace(/\D/g, ''),
      accessTokenRef,
      unitId: accountSchema.unitId ?? null,
      status: 'PENDING',
      lastError: null,
    });
  }
}
