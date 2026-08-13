import { apiClient } from '@/shared/api/api-client';
import type { BookingClinic } from '@/packages/public/types/Booking/BookingTypes';

export async function BookingClinicGetData(slug: string): Promise<BookingClinic> {
  return apiClient.request<BookingClinic>(`/public/clinics/${encodeURIComponent(slug)}`, {
    skipAuth: true,
  });
}
