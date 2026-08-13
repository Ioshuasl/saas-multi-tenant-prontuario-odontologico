import { ApiClientError } from '@/shared/api/api-client';

export function messagingErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (error.code === 'NOT_FOUND') return 'Nenhuma conta WhatsApp conectada.';
    if (error.code === 'PROVIDER_UNAVAILABLE') {
      return error.message || 'Falha no envio de teste. Verifique as credenciais.';
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'Não foi possível concluir a operação.';
}
