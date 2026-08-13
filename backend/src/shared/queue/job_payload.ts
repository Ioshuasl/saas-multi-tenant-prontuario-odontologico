import { z } from 'zod';

/** Todo job carrega tenant + correlação. Demais campos = IDs / metadados (nunca clínico). */
export const jobPayloadSchema = z
  .object({
    tenantId: z.string().uuid(),
    requestId: z.string().min(1),
    eventId: z.string().uuid().optional(),
    eventName: z.string().min(1).optional(),
  })
  .passthrough();

export type JobPayload = z.infer<typeof jobPayloadSchema>;
