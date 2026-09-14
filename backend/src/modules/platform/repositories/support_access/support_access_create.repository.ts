import { Prisma } from '@prisma/client';
import { getPrismaClient } from '../../../../shared/database/tenant_prisma.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import { SUPPORT_ACCESS_SCOPE } from '../../enum/support_access/support_access_scope.enum.js';
import type { SupportAccessRow } from '../../types/support_access/support_access.types.js';
import { mapSupportAccess, type SupportAccessSqlRow } from './mappers/support_access.mapper.js';

export class CreateRepository {
  async execute(input: {
    tenantId: string;
    requesterId: string;
    reason: string;
    hours: number;
  }): Promise<SupportAccessRow> {
    const prisma = getPrismaClient();
    const rows = await prisma.$queryRaw<SupportAccessSqlRow[]>(Prisma.sql`
      INSERT INTO platform.support_access (
        id, tenant_id, requester_id, reason, scope, status, hours, created_at, updated_at
      ) VALUES (
        ${idGenerator.next()}::uuid,
        ${input.tenantId}::uuid,
        ${input.requesterId}::uuid,
        ${input.reason},
        ${SUPPORT_ACCESS_SCOPE},
        'PENDING',
        ${input.hours},
        NOW(),
        NOW()
      )
      RETURNING id, tenant_id, requester_id, approver_id, reason, scope, status, hours, expires_at, created_at, updated_at
    `);
    const row = rows[0];
    if (!row) throw new Error('support_access insert returned no row');
    return mapSupportAccess(row);
  }
}
