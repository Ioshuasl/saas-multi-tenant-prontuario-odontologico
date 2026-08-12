import { ApiClientError } from '@/shared/api/api-client';

export function operacionalErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Não foi possível concluir a operação.';
}
