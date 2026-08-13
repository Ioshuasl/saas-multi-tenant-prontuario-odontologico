import { apiClient } from '@/shared/api/api-client';
import type { BookingConfirmResult } from '@/packages/public/types/BookingConfirm/BookingConfirmTypes';

export async function BookingConfirmGetData(token: string): Promise<BookingConfirmResult> {
  return apiClient.request<BookingConfirmResult>(
    `/public/appointments/${encodeURIComponent(token)}/confirm`,
    { skipAuth: true },
  );
}
