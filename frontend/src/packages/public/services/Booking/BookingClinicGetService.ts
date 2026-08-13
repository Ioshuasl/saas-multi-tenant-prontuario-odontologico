import { BookingClinicGetData } from '@/packages/public/data/Booking/BookingClinicGetData';

export async function BookingClinicGetService(slug: string) {
  return BookingClinicGetData(slug);
}
