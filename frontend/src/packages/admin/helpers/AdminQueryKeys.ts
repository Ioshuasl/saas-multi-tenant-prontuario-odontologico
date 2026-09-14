import type { DashboardQuery } from '@/packages/admin/types/Report/ReportTypes';
import type { NoShowsQuery } from '@/packages/admin/types/Report/ReportTypes';
import type { ProceduresQuery } from '@/packages/admin/types/Report/ReportTypes';
import type { RevenueQuery } from '@/packages/admin/types/Report/ReportTypes';

export const adminQueryKeys = {
  clinic: ['clinic'] as const,
  chairs: (unitId: string) => ['chairs', unitId] as const,
  businessHours: (unitId: string, professionalId?: string | null) =>
    ['business-hours', unitId, professionalId ?? null] as const,
  professionals: ['professionals'] as const,
  procedures: ['procedures'] as const,
  members: ['members'] as const,
  invitations: ['invitations'] as const,
  onboarding: ['onboarding'] as const,
  anamnesisForms: ['anamnesis-forms'] as const,
  dashboard: (query: DashboardQuery) => ['reports', 'dashboard', query] as const,
  dashboardAppointments: (query: { from: string; to: string }) =>
    ['dashboard', 'appointments', query.from, query.to] as const,
  noShows: (query: NoShowsQuery) => ['reports', 'no-shows', query] as const,
  revenue: (query: RevenueQuery) => ['reports', 'revenue', query] as const,
  reportProcedures: (query: ProceduresQuery) => ['reports', 'procedures', query] as const,
  reportExport: (exportId: string) => ['reports', 'export', exportId] as const,
  subscription: ['subscription'] as const,
  subscriptionPlans: ['subscription', 'plans'] as const,
  subscriptionUsage: ['subscription', 'usage'] as const,
};
