import { apiClient } from '@/shared/api/api-client';
import type { BookingCreateInput, BookingCreateResult } from '@/packages/public/types/Booking/BookingTypes';

export async function BookingCreateData(
  bookingSchema: BookingCreateInput,
): Promise<BookingCreateResult> {
  const { slug, ...body } = bookingSchema;
  return apiClient.request<BookingCreateResult>(
    `/public/clinics/${encodeURIComponent(slug)}/bookings`,
    {
      method: 'POST',
      body: JSON.stringify(body),
      skipAuth: true,
    },
  );
}
