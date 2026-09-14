export type AuditLogListItem = {
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

export type AuditLogListResult = {
  items: AuditLogListItem[];
  nextCursor: string | null;
};

export type AuditLogListQuery = {
  patientId?: string;
  actorId?: string;
  action?: string;
  from: Date;
  to: Date;
  cursor?: string;
  limit: number;
};
