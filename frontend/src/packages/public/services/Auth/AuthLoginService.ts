import { AuthLoginData } from '@/packages/public/data/Auth/AuthLoginData';
import type { AuthLoginFormValues } from '@/packages/public/schemas/Auth/AuthSchema';

export async function AuthLoginService(authSchema: AuthLoginFormValues) {
  return AuthLoginData(authSchema);
}
