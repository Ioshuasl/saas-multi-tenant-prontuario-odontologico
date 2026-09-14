'use client';

import { useQuery } from '@tanstack/react-query';
import { ApiClientError } from '@/shared/api/api-client';
import { messagingQueryKeys } from '@/packages/messaging/helpers/MessagingQueryKeys';
import { InboxPatientContextGetService } from '@/packages/messaging/services/Inbox/InboxPatientContextGetService';

export function useInboxPatientContextHook(patientId: string | null) {
  return useQuery({
    queryKey: messagingQueryKeys.patientContext(patientId ?? ''),
    queryFn: async () => {
      try {
        return await InboxPatientContextGetService(patientId!);
      } catch (error) {
        if (error instanceof ApiClientError && error.status === 404) {
          return { patient: null, nextAppointment: null };
        }
        throw error;
      }
    },
    enabled: Boolean(patientId),
    staleTime: 30_000,
  });
}
