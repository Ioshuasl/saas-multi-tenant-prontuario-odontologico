import { z } from 'zod';
import { ATTACHMENT_CATEGORIES } from '../enum/attachment/attachment_category.enum.js';

export const attachmentListQuerySchema = z
  .object({
    category: z.enum(ATTACHMENT_CATEGORIES).optional(),
  })
  .strict();

export type AttachmentListQuerySchema = z.infer<typeof attachmentListQuerySchema>;

export const attachmentPresignSchema = z
  .object({
    fileName: z.string().min(1).max(200),
    mimeType: z.string().min(1).max(100),
    sizeBytes: z.number().int().positive(),
    category: z.enum(ATTACHMENT_CATEGORIES),
  })
  .strict();

export type AttachmentPresignSchema = z.infer<typeof attachmentPresignSchema>;

export const attachmentConfirmSchema = z
  .object({
    storageKey: z.string().min(1).max(500),
    checksumSha256: z.string().regex(/^[a-f0-9]{64}$/i),
    fileName: z.string().min(1).max(200),
    mimeType: z.string().min(1).max(100),
    sizeBytes: z.number().int().positive(),
    category: z.enum(ATTACHMENT_CATEGORIES),
    clinicalNoteId: z.string().uuid().optional().nullable(),
  })
  .strict();

export type AttachmentConfirmSchema = z.infer<typeof attachmentConfirmSchema>;

export const attachmentDeleteSchema = z
  .object({
    reason: z.string().min(1).max(2000),
  })
  .strict();

export type AttachmentDeleteSchema = z.infer<typeof attachmentDeleteSchema>;

export const attachmentIdParamSchema = z
  .object({
    id: z.string().uuid(),
  })
  .strict();

export type AttachmentIdParamSchema = z.infer<typeof attachmentIdParamSchema>;
