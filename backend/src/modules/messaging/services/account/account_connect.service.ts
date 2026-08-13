import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { ConnectAction } from '../../actions/account/account_connect.action.js';
import type { AccountConnectSchema } from '../../schemas/messaging.schema.js';
import type { WhatsappAccountSummary } from '../../types/messaging.types.js';

export class ConnectService {
  constructor(private readonly connect = new ConnectAction()) {}

  async execute(ctx: RequestContext, accountSchema: AccountConnectSchema): Promise<WhatsappAccountSummary> {
    return this.connect.execute(ctx, accountSchema);
  }
}
