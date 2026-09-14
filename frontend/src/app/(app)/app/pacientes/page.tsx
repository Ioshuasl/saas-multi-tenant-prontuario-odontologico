import { Suspense } from 'react';
import { PatientIndex } from '@/packages/operacional/components/Patient/PatientIndex';

export default function PacientesPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando pacientes…</p>}>
      <PatientIndex />
    </Suspense>
  );
}
