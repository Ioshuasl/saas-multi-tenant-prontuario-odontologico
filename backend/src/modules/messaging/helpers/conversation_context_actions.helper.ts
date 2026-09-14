import type { ConversationContextAction } from '../types/conversation/conversation.types.js';

/** RF-E8-10 Should — metadados de deep-link; navegação fica no frontend. */
export function buildConversationContextActions(patientId: string): ConversationContextAction[] {
  const query = `patientId=${patientId}`;
  return [
    { key: 'SCHEDULE', label: 'Agendar', href: `/app/agenda/novo?${query}` },
    { key: 'QUOTE', label: 'Orçamento', href: `/app/orcamentos/novo?${query}` },
    { key: 'ANAMNESIS', label: 'Anamnese', href: `/app/pacientes/${patientId}/anamnese` },
    { key: 'RECEIPT', label: 'Recibo', href: `/app/financeiro/receber?${query}` },
    { key: 'CHARGE', label: 'Cobrar', href: `/app/financeiro/inadimplencia?${query}` },
  ];
}
