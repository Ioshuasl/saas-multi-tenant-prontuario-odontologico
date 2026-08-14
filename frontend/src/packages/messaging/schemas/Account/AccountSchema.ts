import { z } from 'zod';

export const AccountConnectSchema = z.object({
  riskAccepted: z.boolean().refine((value) => value === true, {
    message: 'Marque a declaração de ciência para conectar.',
  }),
});

export type AccountConnectFormValues = z.infer<typeof AccountConnectSchema>;
