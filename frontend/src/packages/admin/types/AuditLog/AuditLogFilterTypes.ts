import type { MemberSummary } from '@/packages/admin/types/Member/MemberTypes';
import type { AuditLogPatientOption } from '@/packages/admin/types/AuditLog/AuditLogTypes';

export type AuditLogFilterProps = {
  patientSearch: string;
  onPatientSearchChange: (value: string) => void;
  patients: AuditLogPatientOption[];
  patientId: string;
  onPatientIdChange: (value: string) => void;
  members: MemberSummary[];
  actorId: string;
  onActorIdChange: (value: string) => void;
  action: string;
  onActionChange: (value: string) => void;
  from: string;
  onFromChange: (value: string) => void;
  to: string;
  onToChange: (value: string) => void;
};
