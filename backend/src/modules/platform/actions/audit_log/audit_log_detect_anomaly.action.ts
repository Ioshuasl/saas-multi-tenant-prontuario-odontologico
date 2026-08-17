import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { env } from '../../../../shared/config/env.js';
import { logger } from '../../../../shared/config/logger.js';
import { AuditAction, writeAuditLogSafe } from '../../../../shared/database/write_audit.js';
import { GetRecentAnomalyRepository } from '../../repositories/audit_log/audit_log_get_recent_anomaly.repository.js';
import { ListBurstRepository } from '../../repositories/audit_log/audit_log_list_burst.repository.js';

const WINDOW_MS = 5 * 60_000;

export class DetectAction {
  constructor(
    private readonly bursts = new ListBurstRepository(),
    private readonly recent = new GetRecentAnomalyRepository(),
  ) {}

  async execute(ctx: RequestContext): Promise<number> {
    const since = new Date(Date.now() - WINDOW_MS);
    const threshold = env.CLINICAL_READ_ANOMALY_N;
    const found = await this.bursts.execute(ctx, { since, threshold });
    let written = 0;
    for (const burst of found) {
      const already = await this.recent.execute(ctx, { actorId: burst.actorId, since });
      if (already) continue;
      await writeAuditLogSafe({
        tenantId: ctx.tenantId,
        actorType: 'SYSTEM',
        action: AuditAction.ANOMALY_TRIGGERED,
        resourceType: 'user',
        resourceId: burst.actorId,
        metadata: {
          rule: 'anomaly.clinical_read_burst',
          count: burst.count,
          windowMinutes: 5,
          threshold,
        },
      });
      logger.warn(
        {
          tenantId: ctx.tenantId,
          requestId: ctx.requestId,
          actorId: burst.actorId,
          count: burst.count,
          threshold,
        },
        'anomaly_clinical_read_burst',
      );
      written += 1;
    }
    return written;
  }
}
