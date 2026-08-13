const prefix = 'clinical-note-draft:';

export function clinicalNoteDraftKey(appointmentId: string): string {
  return `${prefix}${appointmentId}`;
}

export function readClinicalNoteDraft(appointmentId: string): string {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem(clinicalNoteDraftKey(appointmentId)) ?? '';
  } catch {
    return '';
  }
}

export function writeClinicalNoteDraft(appointmentId: string, content: string): void {
  if (typeof window === 'undefined') return;
  try {
    const key = clinicalNoteDraftKey(appointmentId);
    if (!content.trim()) {
      window.localStorage.removeItem(key);
      return;
    }
    window.localStorage.setItem(key, content);
  } catch {
    // ignore quota / private mode
  }
}

export function clearClinicalNoteDraft(appointmentId: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(clinicalNoteDraftKey(appointmentId));
  } catch {
    // ignore
  }
}
