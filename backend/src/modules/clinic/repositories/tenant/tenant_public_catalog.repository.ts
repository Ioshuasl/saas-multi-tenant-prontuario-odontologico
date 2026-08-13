import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import {
  parseBookingSettings,
  type BookingSettings,
} from '../../helpers/booking_settings.helper.js';

export type PublicClinicCatalog = {
  tenantId: string;
  name: string;
  slug: string;
  timezone: string;
  bookingSettings: BookingSettings;
  procedures: Array<{ id: string; name: string; defaultMinutes: number }>;
  professionals: Array<{ id: string; name: string }>;
};

export class GetPublicCatalogRepository {
  async execute(ctx: RequestContext): Promise<PublicClinicCatalog | null> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const tenant = await tx.tenant.findFirst({
        where: { id: ctx.tenantId },
        select: { id: true, name: true, slug: true, timezone: true, bookingSettings: true },
      });
      if (!tenant) return null;

      const procedures = await tx.procedure.findMany({
        where: { tenantId: ctx.tenantId, active: true, publiclyBookable: true },
        select: { id: true, name: true, defaultMinutes: true },
        orderBy: { name: 'asc' },
      });

      const professionals = await tx.professional.findMany({
        where: { tenantId: ctx.tenantId, active: true },
        select: {
          id: true,
          membership: { select: { user: { select: { name: true } } } },
        },
        orderBy: { id: 'asc' },
      });

      return {
        tenantId: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        timezone: tenant.timezone,
        bookingSettings: parseBookingSettings(tenant.bookingSettings),
        procedures,
        professionals: professionals.map((p) => ({
          id: p.id,
          name: p.membership.user?.name ?? 'Profissional',
        })),
      };
    });
  }
}
