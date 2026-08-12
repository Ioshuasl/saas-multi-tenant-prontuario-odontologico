import { AuthResetPasswordData } from '@/packages/public/data/Auth/AuthResetPasswordData';
import type { AuthResetPasswordFormValues } from '@/packages/public/schemas/Auth/AuthSchema';

export async function AuthResetPasswordService(authSchema: AuthResetPasswordFormValues) {
  return AuthResetPasswordData(authSchema);
}
