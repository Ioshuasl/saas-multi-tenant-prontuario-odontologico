import { Suspense } from 'react';
import { InstallmentIndex } from '@/packages/financeiro/components/Installment/InstallmentIndex';

export default function ReceberPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando…</p>}>
      <InstallmentIndex />
    </Suspense>
  );
}
