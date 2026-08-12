import { Role } from '../../enum/role/role.enum.js';
import { LastOwnerError } from '../errors/last_owner.error.js';

export function assertCanChangeOwner(input: {
  isTargetOwner: boolean;
  activeOwnerCount: number;
  nextRole: string;
  nextActive: boolean;
}): void {
  if (!input.isTargetOwner) return;

  const remainsOwner = input.nextActive && input.nextRole === Role.OWNER;
  if (!remainsOwner && input.activeOwnerCount <= 1) {
    throw new LastOwnerError();
  }
}
