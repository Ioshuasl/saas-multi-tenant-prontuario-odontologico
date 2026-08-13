import { BookingVerifyData } from '@/packages/public/data/Booking/BookingVerifyData';
import type { BookingVerifyInput } from '@/packages/public/types/Booking/BookingTypes';

export async function BookingVerifyService(bookingSchema: BookingVerifyInput) {
  return BookingVerifyData(bookingSchema);
}
