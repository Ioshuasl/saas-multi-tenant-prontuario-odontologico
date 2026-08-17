import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type { DataSubjectRequestRow } from '../../types/data_subject_request/data_subject_request.types.js';
import { mapDataSubjectRequest } from './mappers/data_subject_request.mapper.js';

export class GetRepository {
  async execute(ctx: RequestContext, dsrId: string): Promise<DataSubjectRequestRow | null> {
    return getTenantPrisma().runInTenantContext(ctx, async (tx) => {
      const row = await tx.dataSubjectRequest.findFirst({
        where: { id: dsrId, tenantId: ctx.tenantId },
      });
      return row ? mapDataSubjectRequest(row) : null;
    });
  }
}
