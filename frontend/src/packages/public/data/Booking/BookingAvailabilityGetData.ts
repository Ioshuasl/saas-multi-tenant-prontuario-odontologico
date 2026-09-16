import { apiClient } from '@/shared/api/api-client';
import type {
  BookingAvailability,
  BookingAvailabilityQuery,
} from '@/packages/public/types/Booking/BookingTypes';

export async function BookingAvailabilityGetData(
  query: BookingAvailabilityQuery,
): Promise<BookingAvailability> {
  const params = new URLSearchParams({
    professionalId: query.professionalId,
  });
  if (query.procedureId) params.set('procedureId', query.procedureId);
  if (query.from) params.set('from', query.from);
  if (query.to) params.set('to', query.to);
  return apiClient.request<BookingAvailability>(
    `/public/clinics/${encodeURIComponent(query.slug)}/availability?${params.toString()}`,
    { skipAuth: true },
  );
}
