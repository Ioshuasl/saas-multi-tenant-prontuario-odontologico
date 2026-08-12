import { AuthSignupData } from '@/packages/public/data/Auth/AuthSignupData';
import type { AuthSignupFormValues } from '@/packages/public/schemas/Auth/AuthSchema';

export async function AuthSignupService(authSchema: AuthSignupFormValues) {
  return AuthSignupData(authSchema);
}
