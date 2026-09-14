import { z } from 'zod';
import { OPS_SUBSCRIPTION_STATUSES } from '../enum/subscription/subscription_status.enum.js';

export const opsStatusBodySchema = z.object({
  status: z.enum(OPS_SUBSCRIPTION_STATUSES),
  reason: z.string().trim().min(1).max(500).optional(),
});

export type OpsStatusBodySchema = z.infer<typeof opsStatusBodySchema>;
