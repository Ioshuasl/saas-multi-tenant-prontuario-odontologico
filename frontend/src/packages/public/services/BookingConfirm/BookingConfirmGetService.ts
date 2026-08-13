import { BookingConfirmGetData } from '@/packages/public/data/BookingConfirm/BookingConfirmGetData';

export async function BookingConfirmGetService(token: string) {
  return BookingConfirmGetData(token);
}
