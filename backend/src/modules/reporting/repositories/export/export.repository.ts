import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import type { ExportFormat, ExportReport } from '../../enum/export/export.enum.js';
import type { ReportExportFilters, ReportExportRow } from '../../types/export/export.types.js';

function mapRow(row: {
  id: string;
  report: string;
  format: string;
  status: string;
  filters: unknown;
  storageKey: string | null;
  requestedBy: string;
  error: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ReportExportRow {
  return {
    id: row.id,
    report: row.report as ExportReport,
    format: row.format as ExportFormat,
    status: row.status as ReportExportRow['status'],
    filters: (row.filters ?? {}) as ReportExportFilters,
    storageKey: row.storageKey,
    requestedBy: row.requestedBy,
    error: row.error,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export class CreateRepository {
  async execute(
    ctx: RequestContext,
    input: {
      report: ExportReport;
      format: ExportFormat;
      filters: ReportExportFilters;
    },
  ): Promise<ReportExportRow> {
    const id = idGenerator.next();
    return getTenantPrisma().runInTenantContext(ctx, async (tx) => {
      const row = await tx.reportExport.create({
        data: {
          id,
          tenantId: ctx.tenantId,
          report: input.report,
          format: input.format,
          status: 'PENDING',
          filters: input.filters,
          requestedBy: ctx.userId,
        },
      });
      return mapRow(row);
    });
  }
}

export class GetRepository {
  async execute(ctx: RequestContext, exportId: string): Promise<ReportExportRow | null> {
    return getTenantPrisma().runInTenantContext(ctx, async (tx) => {
      const row = await tx.reportExport.findFirst({
        where: { id: exportId, tenantId: ctx.tenantId },
      });
      return row ? mapRow(row) : null;
    });
  }
}

export class UpdateStatusRepository {
  async execute(
    ctx: RequestContext,
    exportId: string,
    input: {
      status: ReportExportRow['status'];
      storageKey?: string | null;
      error?: string | null;
    },
  ): Promise<void> {
    await getTenantPrisma().runInTenantContext(ctx, async (tx) => {
      await tx.reportExport.updateMany({
        where: { id: exportId, tenantId: ctx.tenantId },
        data: {
          status: input.status,
          ...(input.storageKey !== undefined ? { storageKey: input.storageKey } : {}),
          ...(input.error !== undefined ? { error: input.error } : {}),
        },
      });
    });
  }
}
