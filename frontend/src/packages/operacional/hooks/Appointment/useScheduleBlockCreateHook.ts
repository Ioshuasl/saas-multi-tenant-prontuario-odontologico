'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ScheduleBlockCreateService } from '@/packages/operacional/services/Appointment/ScheduleBlockCreateService';
import type { ScheduleBlockCreateInput } from '@/packages/operacional/types/Appointment/AppointmentTypes';

export function useScheduleBlockCreateHook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (blockSchema: ScheduleBlockCreateInput) =>
      ScheduleBlockCreateService(blockSchema),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}
