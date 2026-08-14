export function spCivilDate(offsetDays = 0): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  const [year, month, day] = parts.split('-').map(Number);
  const utc = Date.UTC(year, month - 1, day + offsetDays);
  const shifted = new Date(utc);
  const yyyy = shifted.getUTCFullYear();
  const mm = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(shifted.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function spDateTime(offsetDays: number, hour: number, minute = 0): Date {
  const ymd = spCivilDate(offsetDays);
  const hh = String(hour).padStart(2, '0');
  const min = String(minute).padStart(2, '0');
  return new Date(`${ymd}T${hh}:${min}:00-03:00`);
}

export function dateOnly(offsetDays: number): Date {
  return new Date(`${spCivilDate(offsetDays)}T00:00:00.000Z`);
}
