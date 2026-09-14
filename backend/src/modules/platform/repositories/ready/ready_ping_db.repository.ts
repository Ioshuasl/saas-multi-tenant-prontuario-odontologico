import { getPrismaClient } from '../../../../shared/database/tenant_prisma.js';

export class PingDbRepository {
  async execute(): Promise<boolean> {
    try {
      await getPrismaClient().$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
