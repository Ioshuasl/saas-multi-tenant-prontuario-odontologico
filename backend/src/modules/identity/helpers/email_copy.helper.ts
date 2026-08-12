import { env } from '../../../shared/config/env.js';

export function invitationEmailText(input: {
  clinicName: string;
  role: string;
  token: string;
}): string {
  const url = `${env.APP_PUBLIC_URL}/convite?token=${encodeURIComponent(input.token)}`;
  return [
    `Você foi convidado(a) para a clínica ${input.clinicName} com o perfil ${input.role}.`,
    '',
    `Para aceitar, acesse: ${url}`,
    '',
    'Este convite expira em 7 dias.',
  ].join('\n');
}

export function passwordResetEmailText(token: string): string {
  const url = `${env.APP_PUBLIC_URL}/redefinir-senha?token=${encodeURIComponent(token)}`;
  return [
    'Recebemos um pedido para redefinir sua senha.',
    '',
    `Para continuar, acesse: ${url}`,
    '',
    'Este link expira em 1 hora. Se você não pediu a redefinição, ignore este e-mail.',
  ].join('\n');
}

export function passwordChangedEmailText(): string {
  return [
    'Sua senha foi redefinida com sucesso.',
    '',
    'Se você não fez esta alteração, entre em contato com o suporte imediatamente.',
  ].join('\n');
}
