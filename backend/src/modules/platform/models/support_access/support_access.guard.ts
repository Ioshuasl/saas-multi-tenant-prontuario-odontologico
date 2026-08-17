import {
  GrantWindowInvalidError,
  ReasonTooShortError,
} from '../errors/support_access.errors.js';

const MIN_REASON = 20;
const MAX_HOURS = 4;

export function assertSupportAccessReason(reason: string): void {
  if (reason.trim().length < MIN_REASON) {
    throw new ReasonTooShortError();
  }
}

export function assertSupportAccessHours(hours: number): void {
  if (!Number.isInteger(hours) || hours <= 0 || hours > MAX_HOURS) {
    throw new GrantWindowInvalidError();
  }
}

export function resolveSupportAccessHours(hours: number | undefined): number {
  const value = hours ?? MAX_HOURS;
  assertSupportAccessHours(value);
  return value;
}
