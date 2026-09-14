import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { AuditAction, writeAuditLogSafe } from '../../../../shared/database/write_audit.js';
import { getEmailProvider } from '../../../../shared/integrations/email/index.js';
import { supportGrantEmail } from '../../helpers/support_grant_email.helper.js';
import {
  SelfApprovalForbiddenError,
  SupportAccessNotFoundError,
  SupportAccessStatusInvalidError,
} from '../../models/errors/support_access.errors.js';
import { ListOwnerEmailsRepository } from '../../repositories/data_subject_request/data_subject_request_list_owner_emails.repository.js';
import { ApproveRepository } from '../../repositories/support_access/support_access_approve.repository.js';
import { GetRepository } from '../../repositories/support_access/support_access_get.repository.js';
import type { SupportAccessRow } from '../../types/support_access/support_access.types.js';

export class ApproveAction {
  constructor(
    private readonly get = new GetRepository(),
    private readonly approve = new ApproveRepository(),
    private readonly owners = new ListOwnerEmailsRepository(),
    private readonly email = getEmailProvider(),
  ) {}

  async execute(ctx: RequestContext, grantId: string): Promise<SupportAccessRow> {
    const current = await this.get.execute(grantId);
    if (!current) throw new SupportAccessNotFoundError();
    if (current.status !== 'PENDING') throw new SupportAccessStatusInvalidError();
    if (current.requesterId === ctx.userId) throw new SelfApprovalForbiddenError();

    const row = await this.approve.execute({
      grantId,
      approverId: ctx.userId,
      hours: current.hours,
    });
    if (!row) throw new SelfApprovalForbiddenError();

    const clinicCtx = {
      tenantId: row.tenantId,
      userId: ctx.userId,
      requestId: ctx.requestId,
    };
    const owners = await this.owners.execute(clinicCtx);
    const copy = supportGrantEmail({
      clinicName: owners[0]?.clinicName ?? 'Clínica',
      expiresAt: row.expiresAt ?? new Date(),
    });
    for (const owner of owners) {
      await this.email.send({ to: owner.email, subject: copy.subject, text: copy.text });
    }

    await writeAuditLogSafe({
      tenantId: row.tenantId,
      actorId: row.requesterId,
      actorType: 'SUPPORT',
      action: AuditAction.SUPPORT_ACCESS_GRANTED,
      resourceType: 'support_access',
      resourceId: row.id,
      metadata: {
        requesterId: row.requesterId,
        approverId: row.approverId,
        hours: row.hours,
        expiresAt: row.expiresAt?.toISOString() ?? null,
      },
    });

    return row;
  }
}
