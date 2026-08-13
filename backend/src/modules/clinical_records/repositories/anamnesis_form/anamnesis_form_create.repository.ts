import type { Prisma } from '@prisma/client';
import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import type { AnamnesisFormCreateSchema } from '../../schemas/anamnesis_form.schema.js';
import type { AnamnesisFormSummary } from '../../types/anamnesis_form/anamnesis_form.types.js';
import { mapAnamnesisForm } from './mappers/anamnesis_form.mapper.js';

export class CreateRepository {
  async execute(
    ctx: RequestContext,
    formSchema: AnamnesisFormCreateSchema,
  ): Promise<AnamnesisFormSummary> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const latest = await tx.anamnesisForm.findFirst({
        where: { tenantId: ctx.tenantId, name: formSchema.name },
        orderBy: { version: 'desc' },
        select: { version: true },
      });
      const version = (latest?.version ?? 0) + 1;

      await tx.anamnesisForm.updateMany({
        where: { tenantId: ctx.tenantId, name: formSchema.name, active: true },
        data: { active: false },
      });

      const row = await tx.anamnesisForm.create({
        data: {
          id: idGenerator.next(),
          tenantId: ctx.tenantId,
          name: formSchema.name,
          version,
          questions: formSchema.questions as Prisma.InputJsonValue,
          active: true,
        },
      });
      return mapAnamnesisForm(row);
    });
  }
}
