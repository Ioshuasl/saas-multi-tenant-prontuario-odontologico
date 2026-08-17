import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getObjectStorage } from '../../../../shared/storage/index.js';
import { TenantExportNotFoundError } from '../../models/errors/tenant_export.errors.js';
import {
  TENANT_EXPORT_PRESIGN_TTL_SECONDS,
} from '../../helpers/tenant_export_storage.helper.js';
import { GetRepository } from '../../repositories/tenant_export/tenant_export_get.repository.js';
import type { TenantExportGetResult } from '../../types/tenant_export/tenant_export.types.js';

export class GetService {
  constructor(private readonly get = new GetRepository()) {}

  async execute(ctx: RequestContext, exportId: string): Promise<TenantExportGetResult> {
    const row = await this.get.execute(ctx, exportId);
    if (!row) throw new TenantExportNotFoundError();

    let url: string | null = null;
    let expiresIn: number | null = null;
    if (row.status === 'READY' && row.storageKey) {
      const signed = await getObjectStorage().presignGet(row.storageKey, TENANT_EXPORT_PRESIGN_TTL_SECONDS);
      url = signed.url;
      expiresIn = TENANT_EXPORT_PRESIGN_TTL_SECONDS;
    }

    return {
      exportId: row.id,
      status: row.status,
      url,
      expiresIn,
      error: row.error,
      createdAt: row.createdAt,
    };
  }
}
