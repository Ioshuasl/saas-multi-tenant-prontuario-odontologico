import { BookingCreateData } from '@/packages/public/data/Booking/BookingCreateData';
import type { BookingCreateInput } from '@/packages/public/types/Booking/BookingTypes';

export async function BookingCreateService(bookingSchema: BookingCreateInput) {
  return BookingCreateData(bookingSchema);
}
