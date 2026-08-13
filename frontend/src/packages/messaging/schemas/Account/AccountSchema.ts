import { z } from 'zod';

export const AccountConnectSchema = z.object({
  wabaId: z.string().min(1, 'Informe o WABA ID').max(64),
  phoneNumberId: z.string().min(1, 'Informe o Phone Number ID').max(64),
  displayPhone: z.string().min(8, 'Informe o telefone de exibição').max(20),
  accessToken: z.string().min(8, 'Informe o token de acesso').max(4096),
});

export type AccountConnectFormValues = z.infer<typeof AccountConnectSchema>;
