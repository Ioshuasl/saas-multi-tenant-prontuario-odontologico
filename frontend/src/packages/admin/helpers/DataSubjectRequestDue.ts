const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

export function isDataSubjectRequestDueSoon(dueAt: string, now = Date.now()): boolean {
  return new Date(dueAt).getTime() - now < THREE_DAYS_MS;
}
