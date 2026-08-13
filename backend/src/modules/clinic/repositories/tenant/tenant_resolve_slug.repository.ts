import { getPrismaClient } from '../../../../shared/database/tenant_prisma.js';

export class ResolveTenantBySlugRepository {
  async execute(slug: string): Promise<string | null> {
    const rows = await getPrismaClient().$queryRaw<Array<{ id: string | null }>>`
      SELECT platform.resolve_tenant_by_slug(${slug}) AS id
    `;
    return rows[0]?.id ?? null;
  }
}
