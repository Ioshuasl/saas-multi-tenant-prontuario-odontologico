export type AuditLog = {
  id: string;
  actorId: string | null;
  actorType: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  patientId: string | null;
  ipAddress: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type AuditLogListQuery = {
  patientId?: string;
  actorId?: string;
  action?: string;
  from?: string;
  to?: string;
  cursor?: string;
  limit?: number;
};

export type AuditLogListResult = {
  items: AuditLog[];
  nextCursor: string | null;
};

export type AuditLogPatientOption = {
  id: string;
  code: number;
  name: string;
  socialName: string | null;
};

export type AuditLogPatientListResult = {
  items: AuditLogPatientOption[];
  nextCursor: string | null;
};
