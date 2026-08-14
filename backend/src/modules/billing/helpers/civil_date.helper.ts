export function todayInTimezone(timezone: string, now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export function hourInTimezone(timezone: string, now = new Date()): number {
  const hour = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    hourCycle: 'h23',
  }).format(now);
  return Number(hour);
}

export function civilDateUtc(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00.000Z`);
}
