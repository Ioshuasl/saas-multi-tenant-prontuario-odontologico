import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { AuditAction, writeAuditLogSafe } from '../../../../shared/database/write_audit.js';
import { logger } from '../../../../shared/config/logger.js';
import { getJobQueue } from '../../../../shared/queue/job_queue_singleton.js';
import { RedisUnavailableError } from '../../../../shared/queue/job_queue.port.js';
import { JOB, QUEUE } from '../../../../shared/queue/queue_names.js';
import type { ExportReport } from '../../enum/export/export.enum.js';
import { CreateRepository } from '../../repositories/export/export.repository.js';
import type { ExportCreateSchema } from '../../schemas/report.schema.js';
import type { ReportExportCreateResult, ReportExportFilters } from '../../types/export/export.types.js';

export class CreateAction {
  constructor(private readonly create = new CreateRepository()) {}

  async execute(
    ctx: RequestContext,
    report: ExportReport,
    exportCreateSchema: ExportCreateSchema,
    filters: ReportExportFilters,
  ): Promise<ReportExportCreateResult> {
    const row = await this.create.execute(ctx, {
      report,
      format: exportCreateSchema.format,
      filters,
    });

    try {
      await getJobQueue().add(
        QUEUE.reporting,
        JOB.generateExport,
        {
          tenantId: ctx.tenantId,
          requestId: ctx.requestId,
          exportId: row.id,
        },
        { jobId: `report-export:${row.id}` },
      );
    } catch (err) {
      if (err instanceof RedisUnavailableError) {
        logger.warn(
          { tenantId: ctx.tenantId, exportId: row.id, requestId: ctx.requestId },
          'report_export_enqueue_unavailable',
        );
      } else {
        throw err;
      }
    }

    await writeAuditLogSafe({
      tenantId: ctx.tenantId,
      actorId: ctx.userId,
      action: AuditAction.REPORT_EXPORTED,
      resourceType: 'report_export',
      resourceId: row.id,
      metadata: {
        report,
        format: exportCreateSchema.format,
        filters,
      },
    });

    return { exportId: row.id, status: row.status };
  }
}
