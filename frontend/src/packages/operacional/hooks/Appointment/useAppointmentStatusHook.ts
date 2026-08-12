'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AppointmentStatusService } from '@/packages/operacional/services/Appointment/AppointmentStatusService';
import { AppointmentDeleteService } from '@/packages/operacional/services/Appointment/AppointmentDeleteService';
import { AppointmentSeriesDeleteService } from '@/packages/operacional/services/Appointment/AppointmentSeriesService';
import type { SeriesDeleteScope } from '@/packages/operacional/enum/Appointment/AppointmentStatusEnum';
import type { AppointmentStatusInput } from '@/packages/operacional/types/Appointment/AppointmentTypes';

export function useAppointmentStatusHook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { appointmentId: string; statusSchema: AppointmentStatusInput }) =>
      AppointmentStatusService(input.appointmentId, input.statusSchema),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

export function useAppointmentDeleteHook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { appointmentId: string; reason: string }) =>
      AppointmentDeleteService(input.appointmentId, input.reason),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

export function useAppointmentSeriesDeleteHook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      seriesId: string;
      scope: SeriesDeleteScope;
      appointmentId?: string;
      reason?: string;
    }) => AppointmentSeriesDeleteService(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}
