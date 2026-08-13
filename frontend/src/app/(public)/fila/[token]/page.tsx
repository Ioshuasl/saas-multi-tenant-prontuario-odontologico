import { WaitlistAccept } from '@/packages/public/components/WaitlistAccept/WaitlistAccept';

export const metadata = { title: 'Fila de espera' };

type FilaAcceptPageProps = {
  params: Promise<{ token: string }>;
};

export default async function FilaAcceptPage({ params }: FilaAcceptPageProps) {
  const { token } = await params;
  return <WaitlistAccept token={token} />;
}
