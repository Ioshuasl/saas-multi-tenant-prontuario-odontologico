import { z } from 'zod';
import { CONVERSATION_STATUSES } from '../enum/message/message.enum.js';

export const conversationIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const conversationListQuerySchema = z.object({
  status: z.enum(CONVERSATION_STATUSES).optional(),
  patientId: z.string().uuid().optional(),
  q: z.string().trim().min(1).max(80).optional(),
  unread: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === 'true')),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ConversationListQuerySchema = z.infer<typeof conversationListQuerySchema>;

export const conversationUpdateSchema = z
  .object({
    assignedToUserId: z.string().uuid().nullable().optional(),
    status: z.enum(CONVERSATION_STATUSES).optional(),
    patientId: z.string().uuid().nullable().optional(),
  })
  .strict()
  .refine(
    (value) =>
      value.assignedToUserId !== undefined || value.status !== undefined || value.patientId !== undefined,
    { message: 'Informe assignedToUserId, status ou patientId.' },
  );

export type ConversationUpdateSchema = z.infer<typeof conversationUpdateSchema>;

export const conversationMessageListQuerySchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type ConversationMessageListQuerySchema = z.infer<typeof conversationMessageListQuerySchema>;

export const conversationMessageCreateSchema = z
  .object({
    text: z.string().trim().min(1).max(4096).optional(),
    mediaStorageKey: z.string().min(1).max(500).optional(),
  })
  .strict()
  .refine((value) => Boolean(value.text?.trim()) || Boolean(value.mediaStorageKey), {
    message: 'Informe text ou mediaStorageKey.',
  });

export type ConversationMessageCreateSchema = z.infer<typeof conversationMessageCreateSchema>;

export const conversationMediaPresignSchema = z
  .object({
    fileName: z.string().min(1).max(200),
    mimeType: z.string().min(1).max(100),
    sizeBytes: z.number().int().positive(),
  })
  .strict();

export type ConversationMediaPresignSchema = z.infer<typeof conversationMediaPresignSchema>;

export const patientMessageListQuerySchema = z.object({
  patientId: z.string().uuid(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type PatientMessageListQuerySchema = z.infer<typeof patientMessageListQuerySchema>;
