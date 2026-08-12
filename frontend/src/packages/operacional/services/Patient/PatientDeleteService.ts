import { PatientDeleteData } from '@/packages/operacional/data/Patient/PatientDeleteData';

export async function PatientDeleteService(
  patientId: string,
  confirmFutureAppointments = false,
) {
  return PatientDeleteData(patientId, confirmFutureAppointments);
}
