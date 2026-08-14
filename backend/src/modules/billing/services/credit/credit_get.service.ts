import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getPatientById } from '../../../patients/patients_public.js';
import { PatientNotFoundError } from '../../models/errors/billing.errors.js';
import { BalanceRepository } from '../../repositories/credit_ledger/credit_ledger_balance.repository.js';
import { toJsonCents } from '../../helpers/money.helper.js';
import type { PatientCreditDto } from '../../types/receivable/receivable_http.types.js';

export class GetService {
  constructor(private readonly balance = new BalanceRepository()) {}

  async execute(ctx: RequestContext, patientId: string): Promise<PatientCreditDto> {
    const patient = await getPatientById(ctx, patientId);
    if (!patient) throw new PatientNotFoundError();
    const balanceCents = await this.balance.execute(ctx, patientId);
    return { patientId, balanceCents: toJsonCents(balanceCents) };
  }
}
