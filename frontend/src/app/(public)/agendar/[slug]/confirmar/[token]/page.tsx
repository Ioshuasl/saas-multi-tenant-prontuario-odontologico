import { BookingConfirm } from '@/packages/public/components/BookingConfirm/BookingConfirm';

export const metadata = { title: 'Confirmar consulta' };

type AgendarConfirmPageProps = {
  params: Promise<{ token: string }>;
};

export default async function AgendarConfirmPage({ params }: AgendarConfirmPageProps) {
  const { token } = await params;
  return <BookingConfirm token={token} />;
}
