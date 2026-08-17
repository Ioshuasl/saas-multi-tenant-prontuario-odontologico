import type { SupportAccessScope } from '../../enum/support_access/support_access_scope.enum.js';
import type { SupportAccessStatus } from '../../enum/support_access/support_access_status.enum.js';

export type SupportAccessRow = {
  id: string;
  tenantId: string;
  requesterId: string;
  approverId: string | null;
  reason: string;
  scope: SupportAccessScope;
  status: SupportAccessStatus;
  hours: number;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
