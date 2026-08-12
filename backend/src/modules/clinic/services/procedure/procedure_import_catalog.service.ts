import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { ImportCatalogAction } from '../../actions/procedure/procedure_import_catalog.action.js';
import type { ImportCatalogResult } from '../../types/clinic.types.js';

export class ImportCatalogService {
  constructor(private readonly action = new ImportCatalogAction()) {}

  async execute(ctx: RequestContext): Promise<ImportCatalogResult> {
    return this.action.execute(ctx);
  }
}
