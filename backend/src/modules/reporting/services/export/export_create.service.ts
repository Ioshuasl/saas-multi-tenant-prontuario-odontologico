import type { RequestContext } from '../../../../shared/domain/request_context.js';
import {
  ExportFormatNotSupportedError,
  ReportExportForbiddenError,
  UnknownExportReportError,
} from '../../models/errors/reporting.errors.js';
import { CreateAction } from '../../actions/export/export_create.action.js';
import { resolvePeriod } from '../../helpers/reporting_period.helper.js';
import { hasFinancialReports, resolveProfessionalScope } from '../../helpers/reporting_scope.helper.js';
import type { ExportCreateSchema } from '../../schemas/report.schema.js';
import type { ExportReport } from '../../enum/export/export.enum.js';
import type { ReportExportCreateResult, ReportExportFilters } from '../../types/export/export.types.js';

function assertCanExport(ctx: RequestContext, report: ExportReport): void {
  if (report === 'revenue' && !hasFinancialReports(ctx)) {
    throw new ReportExportForbiddenError();
  }
}

export class CreateService {
  constructor(private readonly create = new CreateAction()) {}

  async execute(
    ctx: RequestContext,
    report: string,
    exportCreateSchema: ExportCreateSchema,
  ): Promise<ReportExportCreateResult> {
    if (!['no-shows', 'revenue', 'procedures'].includes(report)) {
      throw new UnknownExportReportError();
    }
    const exportReport = report as ExportReport;
    assertCanExport(ctx, exportReport);

    if (exportCreateSchema.format === 'XLSX') {
      throw new ExportFormatNotSupportedError();
    }

    const period = await resolvePeriod(ctx, exportCreateSchema);
    const professionalId = await resolveProfessionalScope(ctx, exportCreateSchema.professionalId);

    const filters: ReportExportFilters = {
      from: period.from,
      to: period.to,
      professionalId,
      unitId: exportCreateSchema.unitId,
      groupBy: exportCreateSchema.groupBy,
    };

    return this.create.execute(ctx, exportReport, exportCreateSchema, filters);
  }
}
