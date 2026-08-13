import { AttendanceForm } from '@/packages/clinico/components/Attendance/AttendanceForm';

type AttendancePageProps = {
  params: Promise<{ appointmentId: string }>;
};

export default async function AttendancePage({ params }: AttendancePageProps) {
  const { appointmentId } = await params;
  return <AttendanceForm appointmentId={appointmentId} />;
}
