import { PatientDetail } from '@/packages/operacional/components/Patient/PatientDetail';

type PacienteDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PacienteDetailPage({ params }: PacienteDetailPageProps) {
  const { id } = await params;
  return <PatientDetail patientId={id} />;
}
