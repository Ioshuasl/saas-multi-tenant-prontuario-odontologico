import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getObjectStorage } from '../../../../shared/storage/index.js';
import {
  ExportNotFoundError,
  ReportExportForbiddenError,
} from '../../models/errors/reporting.errors.js';
import {
  REPORT_EXPORT_PRESIGN_TTL_SECONDS,
} from '../../helpers/report_export_storage.helper.js';
import { hasFinancialReports } from '../../helpers/reporting_scope.helper.js';
import { GetRepository } from '../../repositories/export/export.repository.js';
import type { ExportReport } from '../../enum/export/export.enum.js';
import type { ReportExportGetResult } from '../../types/export/export.types.js';

function assertCanRead(ctx: RequestContext, report: ExportReport): void {
  if (report === 'revenue' && !hasFinancialReports(ctx)) {
    throw new ReportExportForbiddenError();
  }
}

export class GetService {
  constructor(private readonly get = new GetRepository()) {}

  async execute(ctx: RequestContext, exportId: string): Promise<ReportExportGetResult> {
    const row = await this.get.execute(ctx, exportId);
    if (!row) throw new ExportNotFoundError();
    assertCanRead(ctx, row.report);

    let url: string | null = null;
    let expiresIn: number | null = null;
    if (row.status === 'READY' && row.storageKey) {
      const signed = await getObjectStorage().presignGet(row.storageKey, REPORT_EXPORT_PRESIGN_TTL_SECONDS);
      url = signed.url;
      expiresIn = REPORT_EXPORT_PRESIGN_TTL_SECONDS;
    }

    return {
      id: row.id,
      report: row.report,
      format: row.format,
      status: row.status,
      url,
      expiresIn,
      error: row.error,
      createdAt: row.createdAt,
    };
  }
}
