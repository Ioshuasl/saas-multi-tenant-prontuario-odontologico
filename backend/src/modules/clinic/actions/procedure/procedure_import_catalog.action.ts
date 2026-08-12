import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { DEFAULT_PROCEDURE_CATALOG } from '../../helpers/procedure_catalog.helper.js';
import { CreateManyIfMissingRepository } from '../../repositories/procedure/procedure.repository.js';
import type { ImportCatalogResult } from '../../types/clinic.types.js';

export class ImportCatalogAction {
  constructor(private readonly createMany = new CreateManyIfMissingRepository()) {}

  async execute(ctx: RequestContext): Promise<ImportCatalogResult> {
    return this.createMany.execute(
      ctx,
      DEFAULT_PROCEDURE_CATALOG.map((item) => ({
        code: item.code,
        name: item.name,
        specialty: item.specialty,
        defaultMinutes: item.defaultMinutes,
        requiresTooth: item.requiresTooth,
        requiresFace: item.requiresFace ?? false,
      })),
    );
  }
}
