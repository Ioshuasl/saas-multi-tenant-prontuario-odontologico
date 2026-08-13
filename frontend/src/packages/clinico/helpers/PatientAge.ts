export function ageFromBirthDate(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const birth = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDelta = now.getMonth() - birth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age >= 0 ? age : null;
}
