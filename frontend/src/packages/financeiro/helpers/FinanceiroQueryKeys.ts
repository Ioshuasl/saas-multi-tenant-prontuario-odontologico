export const financeiroQueryKeys = {
  installments: (query: {
    patientId?: string;
    status?: string;
    dueFrom?: string;
    dueTo?: string;
  }) =>
    [
      'installments',
      query.patientId ?? '',
      query.status ?? '',
      query.dueFrom ?? '',
      query.dueTo ?? '',
    ] as const,
  patientCredit: (patientId: string) => ['patient-credit', patientId] as const,
  patients: (search?: string) => ['financeiro-patients', search ?? ''] as const,
  clinicUnit: ['clinic-default-unit'] as const,
  cashSessionCurrent: (unitId: string) => ['cash-session-current', unitId] as const,
  payables: (query: { status?: string; dueFrom?: string; dueTo?: string }) =>
    ['payables', query.status ?? '', query.dueFrom ?? '', query.dueTo ?? ''] as const,
  financialCategories: (kind?: string) => ['financial-categories', kind ?? ''] as const,
  cashFlow: (query: { from: string; to: string; basis: string; unitId?: string }) =>
    ['cash-flow', query.from, query.to, query.basis, query.unitId ?? ''] as const,
  overdue: (unitId?: string) => ['overdue-report', unitId ?? ''] as const,
  production: (query: { from: string; to: string; professionalId?: string }) =>
    ['production-report', query.from, query.to, query.professionalId ?? ''] as const,
  professionals: ['financeiro-professionals'] as const,
};
