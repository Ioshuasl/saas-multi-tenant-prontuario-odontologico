import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { resolveAuditPeriod } from '../../helpers/audit_period.helper.js';
import { ListRepository } from '../../repositories/audit_log/audit_log_list.repository.js';
import type { AuditLogListQuerySchema } from '../../schemas/audit_log.schema.js';
import type { AuditLogListResult } from '../../types/audit_log/audit_log_list.types.js';

const DEFAULT_LIMIT = 50;

export class ListService {
  constructor(private readonly list = new ListRepository()) {}

  async execute(
    ctx: RequestContext,
    auditLogSchema: AuditLogListQuerySchema,
  ): Promise<AuditLogListResult> {
    const period = resolveAuditPeriod({ from: auditLogSchema.from, to: auditLogSchema.to });
    return this.list.execute(ctx, {
      patientId: auditLogSchema.patientId,
      actorId: auditLogSchema.actorId,
      action: auditLogSchema.action,
      from: period.from,
      to: period.to,
      cursor: auditLogSchema.cursor,
      limit: auditLogSchema.limit ?? DEFAULT_LIMIT,
    });
  }
}
