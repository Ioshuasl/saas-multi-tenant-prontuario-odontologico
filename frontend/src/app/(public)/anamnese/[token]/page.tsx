import { AnamnesisForm } from '@/packages/public/components/Anamnesis/AnamnesisForm';

export const metadata = { title: 'Anamnese' };

type AnamnesePageProps = {
  params: Promise<{ token: string }>;
};

export default async function AnamnesePage({ params }: AnamnesePageProps) {
  const { token } = await params;
  return <AnamnesisForm token={token} />;
}
