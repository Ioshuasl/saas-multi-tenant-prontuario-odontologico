import { Suspense } from 'react';
import { NoShowsIndex } from '@/packages/admin/components/Report/NoShowsIndex';

export default function RelatoriosFaltasPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando…</p>}>
      <NoShowsIndex />
    </Suspense>
  );
}
