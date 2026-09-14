import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function formatConversationTime(iso: string | null): string {
  if (!iso) return '';
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: ptBR });
  } catch {
    return iso;
  }
}

export function formatMessageTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
