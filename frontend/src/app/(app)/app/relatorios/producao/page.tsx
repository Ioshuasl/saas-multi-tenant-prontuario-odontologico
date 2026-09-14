import { Suspense } from 'react';
import { ProceduresIndex } from '@/packages/admin/components/Report/ProceduresIndex';

export default function RelatoriosProducaoPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando…</p>}>
      <ProceduresIndex />
    </Suspense>
  );
}
