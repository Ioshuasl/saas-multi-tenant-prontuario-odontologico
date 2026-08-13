import { BookingAvailabilityGetData } from '@/packages/public/data/Booking/BookingAvailabilityGetData';
import type { BookingAvailabilityQuery } from '@/packages/public/types/Booking/BookingTypes';

export async function BookingAvailabilityGetService(query: BookingAvailabilityQuery) {
  return BookingAvailabilityGetData(query);
}
