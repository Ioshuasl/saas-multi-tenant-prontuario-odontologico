import type { DbTransaction } from '../../../../shared/database/db_transaction.js';
import { DEFAULT_PROCEDURE_CATALOG } from '../../helpers/procedure_catalog.helper.js';
import type {
  ClinicOnboardingSeedInput,
  ClinicOnboardingSeedResult,
} from '../../types/ports/clinic_onboarding.port.js';

const BUSINESS_START = new Date('1970-01-01T08:00:00.000Z');
const BUSINESS_END = new Date('1970-01-01T18:00:00.000Z');
const WEEKDAYS = [1, 2, 3, 4, 5];

export class OnboardingSeedRepository {
  async execute(
    tx: DbTransaction,
    input: ClinicOnboardingSeedInput,
  ): Promise<ClinicOnboardingSeedResult> {
    const unitId = input.idNext();

    await tx.unit.create({
      data: {
        id: unitId,
        tenantId: input.tenantId,
        name: input.clinicName,
        isDefault: true,
      },
    });

    for (const weekday of WEEKDAYS) {
      await tx.businessHours.create({
        data: {
          id: input.idNext(),
          tenantId: input.tenantId,
          unitId,
          weekday,
          startsAt: BUSINESS_START,
          endsAt: BUSINESS_END,
        },
      });
    }

    for (const procedure of DEFAULT_PROCEDURE_CATALOG) {
      await tx.procedure.create({
        data: {
          id: input.idNext(),
          tenantId: input.tenantId,
          code: procedure.code,
          name: procedure.name,
          specialty: procedure.specialty,
          defaultMinutes: procedure.defaultMinutes,
          priceCents: BigInt(0),
          requiresTooth: procedure.requiresTooth,
          requiresFace: procedure.requiresFace ?? false,
          publiclyBookable: procedure.code === 'CONS-01' || procedure.code === 'PROF-01',
        },
      });
    }

    return { unitId };
  }
}