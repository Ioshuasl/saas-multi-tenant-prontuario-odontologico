import { AuthForgotPasswordData } from '@/packages/public/data/Auth/AuthForgotPasswordData';
import type { AuthForgotPasswordFormValues } from '@/packages/public/schemas/Auth/AuthSchema';

export async function AuthForgotPasswordService(authSchema: AuthForgotPasswordFormValues) {
  return AuthForgotPasswordData(authSchema);
}
