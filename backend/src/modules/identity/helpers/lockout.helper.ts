const FAILURES_BEFORE_LOCK = 5;
const BASE_LOCK_MS = 10 * 60 * 1000;
const MAX_LOCK_MS = 24 * 60 * 60 * 1000;

export function nextLockout(failedAttempts: number, now = new Date()): Date | null {
  if (failedAttempts < FAILURES_BEFORE_LOCK) return null;

  const steps = Math.floor((failedAttempts - FAILURES_BEFORE_LOCK) / FAILURES_BEFORE_LOCK);
  const ms = Math.min(BASE_LOCK_MS * 2 ** steps, MAX_LOCK_MS);
  return new Date(now.getTime() + ms);
}

export function isLocked(lockedUntil: Date | null | undefined, now = new Date()): boolean {
  return Boolean(lockedUntil && lockedUntil > now);
}
