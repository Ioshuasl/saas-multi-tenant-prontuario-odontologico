import type { Prisma } from '@prisma/client';
import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import { mapAutomation, parseAutomationConfig } from '../../helpers/messaging_mapper.helper.js';
import type { AutomationConfig, AutomationSummary } from '../../types/messaging.types.js';

export class ListAutomationsRepository {
  async execute(ctx: RequestContext): Promise<AutomationSummary[]> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const rows = await tx.automation.findMany({
        where: { tenantId: ctx.tenantId },
        orderBy: { key: 'asc' },
      });
      return rows.map(mapAutomation);
    });
  }
}

export class GetAutomationByKeyRepository {
  async execute(ctx: RequestContext, key: string): Promise<AutomationSummary | null> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const row = await tx.automation.findFirst({
        where: { tenantId: ctx.tenantId, key },
      });
      return row ? mapAutomation(row) : null;
    });
  }
}

export class UpdateAutomationRepository {
  async execute(
    ctx: RequestContext,
    key: string,
    patch: { enabled?: boolean; config?: AutomationConfig },
  ): Promise<AutomationSummary | null> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const existing = await tx.automation.findFirst({
        where: { tenantId: ctx.tenantId, key },
      });
      if (!existing) return null;
      const nextConfig = patch.config
        ? { ...parseAutomationConfig(existing.config), ...patch.config }
        : existing.config;
      const row = await tx.automation.update({
        where: { id: existing.id },
        data: {
          ...(patch.enabled !== undefined ? { enabled: patch.enabled } : {}),
          config: nextConfig as Prisma.InputJsonValue,
        },
      });
      return mapAutomation(row);
    });
  }
}

export class DisableAllAutomationsRepository {
  async execute(ctx: RequestContext): Promise<void> {
    const tenantPrisma = getTenantPrisma();
    await tenantPrisma.runInTenantContext(ctx, async (tx) => {
      await tx.automation.updateMany({
        where: { tenantId: ctx.tenantId },
        data: { enabled: false },
      });
    });
  }
}

export class UpsertAutomationRunRepository {
  async execute(
    ctx: RequestContext,
    input: {
      automationId: string;
      targetType: string;
      targetId: string;
      scheduledFor: Date;
    },
  ): Promise<{ id: string; scheduledFor: Date }> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const existing = await tx.automationRun.findFirst({
        where: {
          tenantId: ctx.tenantId,
          automationId: input.automationId,
          targetType: input.targetType,
          targetId: input.targetId,
        },
      });
      if (existing) {
        const row = await tx.automationRun.update({
          where: { id: existing.id },
          data: {
            scheduledFor: input.scheduledFor,
            executedAt: null,
            result: null,
            messageId: null,
          },
        });
        return { id: row.id, scheduledFor: row.scheduledFor };
      }
      const row = await tx.automationRun.create({
        data: {
          id: idGenerator.next(),
          tenantId: ctx.tenantId,
          automationId: input.automationId,
          targetType: input.targetType,
          targetId: input.targetId,
          scheduledFor: input.scheduledFor,
        },
      });
      return { id: row.id, scheduledFor: row.scheduledFor };
    });
  }
}

export class MarkAutomationRunRepository {
  async execute(
    ctx: RequestContext,
    runId: string,
    patch: { result: string; messageId?: string | null },
  ): Promise<void> {
    const tenantPrisma = getTenantPrisma();
    await tenantPrisma.runInTenantContext(ctx, async (tx) => {
      await tx.automationRun.updateMany({
        where: { id: runId, tenantId: ctx.tenantId },
        data: {
          result: patch.result,
          executedAt: new Date(),
          ...(patch.messageId !== undefined ? { messageId: patch.messageId } : {}),
        },
      });
    });
  }
}

export class SkipAutomationRunsForTargetRepository {
  async execute(ctx: RequestContext, targetType: string, targetId: string, result: string): Promise<void> {
    const tenantPrisma = getTenantPrisma();
    await tenantPrisma.runInTenantContext(ctx, async (tx) => {
      await tx.automationRun.updateMany({
        where: {
          tenantId: ctx.tenantId,
          targetType,
          targetId,
          executedAt: null,
        },
        data: { result, executedAt: new Date() },
      });
    });
  }
}

export class GetAutomationRunRepository {
  async execute(ctx: RequestContext, runId: string) {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      return tx.automationRun.findFirst({
        where: { id: runId, tenantId: ctx.tenantId },
        include: { automation: true },
      });
    });
  }
}
