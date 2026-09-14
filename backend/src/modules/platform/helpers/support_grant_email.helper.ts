export function supportGrantEmail(input: {
  clinicName: string;
  expiresAt: Date;
}): { subject: string; text: string } {
  return {
    subject: `Acesso de suporte concedido — ${input.clinicName}`,
    text: [
      `Clínica: ${input.clinicName}`,
      'Um operador da plataforma recebeu acesso temporário de leitura (break-glass).',
      `Validade: até ${input.expiresAt.toISOString()} (máximo 4 horas).`,
      'O rastro aparece em Auditoria (SUPPORT_ACCESS_GRANTED / SUPPORT_ACCESS_USED).',
      'Este e-mail não contém dados clínicos.',
    ].join('\n'),
  };
}
