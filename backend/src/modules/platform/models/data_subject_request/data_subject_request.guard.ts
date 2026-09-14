import type { DsrStatus } from '../../enum/data_subject_request/data_subject_request_status.enum.js';
import { DSR_TERMINAL_STATUSES } from '../../enum/data_subject_request/data_subject_request_status.enum.js';

export function canTransitionDsrStatus(current: DsrStatus, next: DsrStatus): boolean {
  if (current === next) return true;
  if (DSR_TERMINAL_STATUSES.includes(current)) return false;
  if (next === 'IN_PROGRESS') return current === 'RECEIVED';
  if (next === 'COMPLETED' || next === 'REJECTED') {
    return current === 'RECEIVED' || current === 'IN_PROGRESS';
  }
  return false;
}
