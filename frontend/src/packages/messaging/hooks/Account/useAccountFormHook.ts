'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AccountConnectSchema,
  type AccountConnectFormValues,
} from '@/packages/messaging/schemas/Account/AccountSchema';

export function useAccountFormHook() {
  return useForm<AccountConnectFormValues>({
    resolver: zodResolver(AccountConnectSchema),
    defaultValues: {
      riskAccepted: false,
    },
  });
}
