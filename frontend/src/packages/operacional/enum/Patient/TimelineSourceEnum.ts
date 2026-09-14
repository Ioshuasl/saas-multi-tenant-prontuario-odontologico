export const TIMELINE_SOURCES = [
  'APPOINTMENT',
  'CLINICAL',
  'QUOTE',
  'PAYMENT',
  'MESSAGE',
] as const;

export type TimelineSource = (typeof TIMELINE_SOURCES)[number];

export const TIMELINE_SOURCE_LABELS: Record<TimelineSource, string> = {
  APPOINTMENT: 'Agenda',
  CLINICAL: 'Clínico',
  QUOTE: 'Orçamento',
  PAYMENT: 'Pagamento',
  MESSAGE: 'Mensagem',
};

export function timelineSourceLabel(source: string): string {
  return TIMELINE_SOURCE_LABELS[source as TimelineSource] ?? source;
}
