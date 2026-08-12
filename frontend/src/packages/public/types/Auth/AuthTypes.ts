import type { AuthSession } from '@/shared/auth/AuthTypes';
import type { AuthLoginFormValues } from '@/packages/public/schemas/Auth/AuthSchema';

export type AuthLoginInput = AuthLoginFormValues;
export type AuthLoginResult = AuthSession;
