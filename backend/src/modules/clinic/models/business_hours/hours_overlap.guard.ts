type SlotInput = { weekday: number; startsAt: string; endsAt: string };

export function assertNoHoursOverlap(slots: SlotInput[]): void {
  const byDay = new Map<number, SlotInput[]>();
  for (const slot of slots) {
    const list = byDay.get(slot.weekday) ?? [];
    list.push(slot);
    byDay.set(slot.weekday, list);
  }

  for (const daySlots of byDay.values()) {
    const sorted = [...daySlots].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    for (let i = 0; i < sorted.length; i += 1) {
      const current = sorted[i]!;
      if (current.endsAt <= current.startsAt) {
        throw new Error('ends_at must be after starts_at');
      }
      if (i > 0) {
        const previous = sorted[i - 1]!;
        if (previous.endsAt > current.startsAt) {
          throw new Error('overlap');
        }
      }
    }
  }
}

export function assertEndsAfterStarts(startsAt: string, endsAt: string): boolean {
  return endsAt > startsAt;
}
