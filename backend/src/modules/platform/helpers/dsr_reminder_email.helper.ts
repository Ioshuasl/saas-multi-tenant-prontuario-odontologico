import type { DsrType } from '../enum/data_subject_request/data_subject_request_type.enum.js';

export function dsrReminderEmail(input: {
  clinicName: string;
  kind: 'D-3' | 'D-0';
  type: DsrType;
  dueDate: string;
}): { subject: string; text: string } {
  const when = input.kind === 'D-0' ? 'vence hoje' : `vence em 3 dias (${input.dueDate})`;
  return {
    subject: `Solicitação do titular ${when}`,
    text: [
      `Clínica: ${input.clinicName}`,
      `Há uma solicitação do titular (${input.type}) que ${when}.`,
      'Abra Privacidade no sistema para concluir o prazo.',
      'Este e-mail não contém dados clínicos.',
    ].join('\n'),
  };
}
