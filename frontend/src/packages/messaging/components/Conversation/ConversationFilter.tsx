'use client';

import {
  CONVERSATION_STATUS_LABELS,
  CONVERSATION_STATUSES,
} from '@/packages/messaging/enum/Conversation/ConversationStatusEnum';
import type { ConversationFilterProps } from '@/packages/messaging/types/Conversation/ConversationListTypes';
import { Input } from '@/shared/ui/input';
import { NativeSelect, NativeSelectOption } from '@/shared/ui/native-select';

export function ConversationFilter({
  search,
  status,
  onSearchChange,
  onStatusChange,
}: ConversationFilterProps) {
  return (
    <div className="grid gap-2 px-3 pb-3">
      <Input
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Buscar nome ou telefone…"
        aria-label="Buscar conversas"
      />
      <NativeSelect
        size="sm"
        className="w-full"
        aria-label="Filtrar por status"
        value={status}
        onChange={(e) =>
          onStatusChange(e.target.value as ConversationFilterProps['status'])
        }
      >
        <NativeSelectOption value="">Todas</NativeSelectOption>
        {CONVERSATION_STATUSES.map((item) => (
          <NativeSelectOption key={item} value={item}>
            {CONVERSATION_STATUS_LABELS[item]}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  );
}
