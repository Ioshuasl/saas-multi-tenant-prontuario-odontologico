import { PatientTimelineGetData } from '@/packages/operacional/data/Patient/PatientTimelineGetData';

export async function PatientTimelineGetService(patientId: string) {
  return PatientTimelineGetData(patientId);
}
