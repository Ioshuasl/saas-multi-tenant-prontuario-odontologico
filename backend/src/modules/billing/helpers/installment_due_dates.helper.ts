/** Soma meses civis a uma data YYYY-MM-DD (dia limitado ao último do mês destino). */
export function addCalendarMonths(isoDate: string, months: number): string {
  const [yearRaw, monthRaw, dayRaw] = isoDate.split('-').map(Number);
  const year = yearRaw ?? 1970;
  const month = monthRaw ?? 1;
  const day = dayRaw ?? 1;
  const totalMonths = year * 12 + (month - 1) + months;
  const destYear = Math.floor(totalMonths / 12);
  const destMonth = (totalMonths % 12) + 1;
  const lastDay = new Date(Date.UTC(destYear, destMonth, 0)).getUTCDate();
  const destDay = Math.min(day, lastDay);
  return `${String(destYear).padStart(4, '0')}-${String(destMonth).padStart(2, '0')}-${String(destDay).padStart(2, '0')}`;
}

export function installmentDueDates(firstDueDate: string, count: number): string[] {
  const dates: string[] = [];
  for (let i = 0; i < count; i += 1) {
    dates.push(addCalendarMonths(firstDueDate, i));
  }
  return dates;
}
