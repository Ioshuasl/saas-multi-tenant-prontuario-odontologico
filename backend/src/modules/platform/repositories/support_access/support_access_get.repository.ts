import { Prisma } from '@prisma/client';
import { getPrismaClient } from '../../../../shared/database/tenant_prisma.js';
import type { SupportAccessRow } from '../../types/support_access/support_access.types.js';
import { mapSupportAccess, type SupportAccessSqlRow } from './mappers/support_access.mapper.js';

export class GetRepository {
  async execute(grantId: string): Promise<SupportAccessRow | null> {
    const prisma = getPrismaClient();
    const rows = await prisma.$queryRaw<SupportAccessSqlRow[]>(Prisma.sql`
      SELECT id, tenant_id, requester_id, approver_id, reason, scope, status, hours, expires_at, created_at, updated_at
      FROM platform.support_access
      WHERE id = ${grantId}::uuid
    `);
    const row = rows[0];
    return row ? mapSupportAccess(row) : null;
  }
}
