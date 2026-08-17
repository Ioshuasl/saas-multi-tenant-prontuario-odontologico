import { Prisma } from '@prisma/client';
import { getPrismaClient } from '../../../../shared/database/tenant_prisma.js';
import type { SupportAccessRow } from '../../types/support_access/support_access.types.js';
import { mapSupportAccess, type SupportAccessSqlRow } from './mappers/support_access.mapper.js';

export class ApproveRepository {
  async execute(input: {
    grantId: string;
    approverId: string;
    hours: number;
  }): Promise<SupportAccessRow | null> {
    const prisma = getPrismaClient();
    const rows = await prisma.$queryRaw<SupportAccessSqlRow[]>(Prisma.sql`
      UPDATE platform.support_access
      SET
        approver_id = ${input.approverId}::uuid,
        status = 'APPROVED',
        expires_at = NOW() + make_interval(hours => ${input.hours}::int),
        updated_at = NOW()
      WHERE id = ${input.grantId}::uuid
        AND status = 'PENDING'
        AND requester_id <> ${input.approverId}::uuid
      RETURNING id, tenant_id, requester_id, approver_id, reason, scope, status, hours, expires_at, created_at, updated_at
    `);
    const row = rows[0];
    return row ? mapSupportAccess(row) : null;
  }
}
