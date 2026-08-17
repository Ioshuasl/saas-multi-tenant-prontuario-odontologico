import { SupportAccessNotFoundError } from '../../models/errors/support_access.errors.js';
import { GetRepository } from '../../repositories/support_access/support_access_get.repository.js';
import type { SupportAccessRow } from '../../types/support_access/support_access.types.js';

export class GetService {
  constructor(private readonly get = new GetRepository()) {}

  async execute(grantId: string): Promise<SupportAccessRow> {
    const row = await this.get.execute(grantId);
    if (!row) throw new SupportAccessNotFoundError();
    return row;
  }
}
