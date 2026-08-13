import { apiClient } from '@/shared/api/api-client';
import type { BookingVerifyInput, BookingVerifyResult } from '@/packages/public/types/Booking/BookingTypes';

export async function BookingVerifyData(
  bookingSchema: BookingVerifyInput,
): Promise<BookingVerifyResult> {
  const { slug, bookingId, code } = bookingSchema;
  return apiClient.request<BookingVerifyResult>(
    `/public/clinics/${encodeURIComponent(slug)}/bookings/verify`,
    {
      method: 'POST',
      body: JSON.stringify({ bookingId, code }),
      skipAuth: true,
    },
  );
}
