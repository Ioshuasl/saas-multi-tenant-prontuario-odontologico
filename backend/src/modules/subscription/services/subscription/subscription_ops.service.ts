import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { env } from '../../../../shared/config/env.js';
import { AuditAction, writeAuditLogSafe } from '../../../../shared/database/write_audit.js';
import { getEmailProvider } from '../../../../shared/integrations/email/index.js';
import { addDays } from '../../helpers/period.helper.js';
import { SubscriptionStatus } from '../../enum/subscription/subscription_status.enum.js';
import { UsageMetric } from '../../enum/usage/usage_metric.enum.js';
import { PlanLimitExceededError, PlanNotFoundError, SubscriptionNotFoundError } from '../../models/errors/subscription.errors.js';
import { SubscriptionState } from '../../models/subscription/subscription.model.js';
import { currentPeriodKey, limitForMetric } from '../../helpers/plan_limits.helper.js';
import { GetByCodeRepository } from '../../repositories/plan/plan.repository.js';
import { GetRepository, UpdateRepository } from '../../repositories/subscription/subscription.repository.js';
import { CountRepository, FindRepository, UpsertRepository } from '../../repositories/usage/usage.repository.js';
import type { OpsUpdateInput } from '../../types/ops/ops.types.js';
import type { SubscriptionSnapshot } from '../../types/subscription/subscription.types.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';

export class UpdateService {
  constructor(
    private readonly getSubscription = new GetRepository(),
    private readonly update = new UpdateRepository(),
    private readonly countUsage = new CountRepository(),
  ) {}

  async execute(ctx: RequestContext, input: OpsUpdateInput): Promise<SubscriptionSnapshot> {
    const current = await this.getSubscription.execute(ctx);
    if (!current) throw new SubscriptionNotFoundError();

    let planId = current.planId;
    if (input.planCode) {
      const tenantPrisma = getTenantPrisma();
      const nextPlan = await tenantPrisma.runInTenantContext(ctx, (tx) =>
        new GetByCodeRepository().execute(tx, input.planCode as string),
      );
      if (!nextPlan) throw new PlanNotFoundError();
      const counts = await this.countUsage.execute(ctx);
      for (const metric of [
        UsageMetric.PROFESSIONALS,
        UsageMetric.USERS,
        UsageMetric.UNITS,
        UsageMetric.STORAGE_BYTES,
      ] as const) {
        const limit = limitForMetric(nextPlan.limits, metric);
        const used = this.countUsage.currentFor(counts, metric);
        if (limit !== null && used > limit) {
          throw new PlanLimitExceededError(metric, limit, used);
        }
      }
      planId = nextPlan.id;
    }

    const nextStatus = input.status ?? current.status;
    const currentPeriodEnd =
      input.status === SubscriptionStatus.ACTIVE
        ? addDays(new Date(), 30)
        : current.currentPeriodEnd;

    const updated = await this.update.execute(ctx, {
      status: nextStatus,
      planId,
      currentPeriodEnd,
    });

    await writeAuditLogSafe({
      tenantId: ctx.tenantId,
      actorId: ctx.userId || undefined,
      actorType: ctx.userId ? 'USER' : 'SYSTEM',
      action: AuditAction.SUBSCRIPTION_STATUS_CHANGED,
      resourceType: 'subscription',
      resourceId: updated.id,
      metadata: { status: updated.status, planCode: updated.plan.code, from: current.status },
    });

    return updated;
  }
}

export class ExpireService {
  constructor(
    private readonly getSubscription = new GetRepository(),
    private readonly update = new UpdateRepository(),
    private readonly notices = new UpsertRepository(),
    private readonly findNotice = new FindRepository(),
  ) {}

  async execute(ctx: RequestContext): Promise<{ expired: boolean }> {
    const snapshot = await this.getSubscription.execute(ctx);
    if (!snapshot) return { expired: false };

    const now = new Date();
    const days = SubscriptionState.daysRemaining(snapshot.currentPeriodEnd, now);

    if (
      snapshot.status === SubscriptionStatus.TRIAL &&
      snapshot.currentPeriodEnd &&
      snapshot.currentPeriodEnd.getTime() <= now.getTime()
    ) {
      await this.update.execute(ctx, { status: SubscriptionStatus.EXPIRED });
      await writeAuditLogSafe({
        tenantId: ctx.tenantId,
        actorType: 'SYSTEM',
        action: AuditAction.SUBSCRIPTION_STATUS_CHANGED,
        resourceType: 'subscription',
        resourceId: snapshot.id,
        metadata: { status: SubscriptionStatus.EXPIRED, from: snapshot.status },
      });
      return { expired: true };
    }

    if (snapshot.status === SubscriptionStatus.TRIAL && (days === 3 || days === 1)) {
      await this.notifyTrialEnding(ctx, days);
    }

    return { expired: false };
  }

  private async notifyTrialEnding(ctx: RequestContext, days: number): Promise<void> {
    if (env.NODE_ENV === 'test') return;
    const period = `D-${days}`;
    const already = await this.findNotice.execute(ctx, 'trial_notice', period);
    if (already) return;
    await this.notices.execute(ctx, 'trial_notice', period, 1);
    try {
      const tenantPrisma = getTenantPrisma();
      const owner = await tenantPrisma.runInTenantContext(ctx, async (tx) => {
        return tx.membership.findFirst({
          where: { tenantId: ctx.tenantId, role: 'OWNER', active: true },
          select: { user: { select: { email: true, name: true } } },
        });
      });
      const email = owner?.user?.email;
      if (!email) return;
      await getEmailProvider().send({
        to: email,
        subject: `Seu trial termina em ${days} dia(s)`,
        text: `Olá${owner.user?.name ? ` ${owner.user.name}` : ''}, o período de avaliação termina em ${days} dia(s). Fale conosco para ativar o plano e manter a escrita na clínica.`,
      });
    } catch {
      // aviso não derruba o job
    }
  }
}

export class RecalcService {
  constructor(
    private readonly countUsage = new CountRepository(),
    private readonly upsert = new UpsertRepository(),
  ) {}

  async execute(ctx: RequestContext): Promise<void> {
    const counts = await this.countUsage.execute(ctx);
    const month = currentPeriodKey();
    await this.upsert.execute(ctx, UsageMetric.PROFESSIONALS, 'CURRENT', counts.professionals);
    await this.upsert.execute(ctx, UsageMetric.USERS, 'CURRENT', counts.users);
    await this.upsert.execute(ctx, UsageMetric.UNITS, 'CURRENT', counts.units);
    await this.upsert.execute(ctx, UsageMetric.STORAGE_BYTES, 'CURRENT', counts.storageBytes);
    await this.upsert.execute(ctx, UsageMetric.MESSAGES_MONTH, month, counts.messagesMonth);
  }
}
