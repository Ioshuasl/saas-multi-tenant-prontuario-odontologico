export function messageSendPayloadMatches(
  existing: { conversationId: string; body: string | null; mediaKey: string | null },
  conversationId: string,
  payload: { text?: string; mediaStorageKey?: string },
): boolean {
  if (existing.conversationId !== conversationId) return false;
  const text = payload.text?.trim() ?? null;
  const mediaKey = payload.mediaStorageKey ?? null;
  return existing.body === text && existing.mediaKey === mediaKey;
}
