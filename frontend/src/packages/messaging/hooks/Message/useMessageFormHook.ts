'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  MessageCreateSchema,
  type MessageCreateFormValues,
} from '@/packages/messaging/schemas/Message/MessageSchema';

export function useMessageFormHook() {
  return useForm<MessageCreateFormValues>({
    resolver: zodResolver(MessageCreateSchema),
    defaultValues: { text: '' },
  });
}
