import { BookingForm } from '@/packages/public/components/Booking/BookingForm';

export const metadata = { title: 'Agendar consulta' };

type AgendarPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function AgendarPage({ params }: AgendarPageProps) {
  const { slug } = await params;
  return <BookingForm slug={slug} />;
}
