export const USAGE_METRICS = [
  'professionals',
  'admin_users',
  'units',
  'storage_bytes',
  'messages_month',
  'patients',
] as const;

export type UsageMetric = (typeof USAGE_METRICS)[number];

export const USAGE_METRIC_LABELS: Record<UsageMetric, string> = {
  professionals: 'Profissionais',
  admin_users: 'Usuários admin',
  units: 'Unidades',
  storage_bytes: 'Armazenamento',
  messages_month: 'Mensagens no mês',
  patients: 'Pacientes',
};
