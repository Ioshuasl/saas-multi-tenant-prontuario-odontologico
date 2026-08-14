import type { RequestContext } from '../../../../shared/domain/request_context.js';
import type { DbTransaction } from '../../../../shared/database/db_transaction.js';

export class NextNumberRepository {
  async executeInTx(tx: DbTransaction, ctx: RequestContext): Promise<bigint> {
    const rows = await tx.$queryRaw<Array<{ last_number: bigint }>>`
      INSERT INTO receipt_number_counter (tenant_id, last_number)
      VALUES (${ctx.tenantId}::uuid, 1)
      ON CONFLICT (tenant_id) DO UPDATE
      SET last_number = receipt_number_counter.last_number + 1
      RETURNING last_number
    `;
    return rows[0]?.last_number ?? 1n;
  }
}
