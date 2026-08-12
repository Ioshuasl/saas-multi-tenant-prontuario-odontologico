const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function parseTime(value: string): Date {
  const match = TIME_RE.exec(value);
  if (!match) {
    throw new Error(`Horário inválido: ${value}`);
  }
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return new Date(Date.UTC(1970, 0, 1, hours, minutes, 0));
}

export function formatTime(value: Date): string {
  const hours = value.getUTCHours().toString().padStart(2, '0');
  const minutes = value.getUTCMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function centsToNumber(value: bigint): number {
  return Number(value);
}
