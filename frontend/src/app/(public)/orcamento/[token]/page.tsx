import { QuoteDecisionForm } from '@/packages/public/components/Quote/QuoteDecisionForm';

export const metadata = { title: 'Orçamento' };

type OrcamentoPageProps = {
  params: Promise<{ token: string }>;
};

export default async function OrcamentoPage({ params }: OrcamentoPageProps) {
  const { token } = await params;
  return <QuoteDecisionForm token={token} />;
}
