import { createHmac, timingSafeEqual } from 'node:crypto';

export function verifyHubSignature(
  rawBody: Buffer,
  signatureHeader: string | undefined,
  appSecret: string,
): boolean {
  if (!signatureHeader?.startsWith('sha256=')) return false;
  const expectedHex = createHmac('sha256', appSecret).update(rawBody).digest('hex');
  const actualHex = signatureHeader.slice('sha256='.length).trim().toLowerCase();
  if (expectedHex.length !== actualHex.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expectedHex, 'utf8'), Buffer.from(actualHex, 'utf8'));
  } catch {
    return false;
  }
}

export type WebhookInbound = {
  wamid: string;
  from: string;
  phoneNumberId: string;
  type: string;
  text?: string;
  buttonPayload?: string;
  buttonText?: string;
};

export type WebhookStatus = {
  wamid: string;
  status: string;
  phoneNumberId: string;
};

export type ParsedWhatsappWebhook = {
  inbounds: WebhookInbound[];
  statuses: WebhookStatus[];
  firstWamid: string | null;
  phoneNumberId: string | null;
};

export function parseWhatsappWebhook(body: unknown): ParsedWhatsappWebhook {
  const inbounds: WebhookInbound[] = [];
  const statuses: WebhookStatus[] = [];
  if (!body || typeof body !== 'object') {
    return { inbounds, statuses, firstWamid: null, phoneNumberId: null };
  }
  const root = body as { entry?: unknown };
  const entries = Array.isArray(root.entry) ? root.entry : [];
  for (const entry of entries) {
    if (!entry || typeof entry !== 'object') continue;
    const changes = Array.isArray((entry as { changes?: unknown }).changes)
      ? (entry as { changes: unknown[] }).changes
      : [];
    for (const change of changes) {
      if (!change || typeof change !== 'object') continue;
      const value = (change as { value?: unknown }).value;
      if (!value || typeof value !== 'object') continue;
      const metadata = (value as { metadata?: { phone_number_id?: unknown } }).metadata;
      const phoneNumberId =
        typeof metadata?.phone_number_id === 'string' ? metadata.phone_number_id : '';
      const messages = Array.isArray((value as { messages?: unknown }).messages)
        ? (value as { messages: unknown[] }).messages
        : [];
      for (const message of messages) {
        if (!message || typeof message !== 'object') continue;
        const msg = message as {
          id?: unknown;
          from?: unknown;
          type?: unknown;
          text?: { body?: unknown };
          button?: { payload?: unknown; text?: unknown };
        };
        if (typeof msg.id !== 'string' || typeof msg.from !== 'string') continue;
        inbounds.push({
          wamid: msg.id,
          from: msg.from,
          phoneNumberId,
          type: typeof msg.type === 'string' ? msg.type : 'text',
          text: typeof msg.text?.body === 'string' ? msg.text.body : undefined,
          buttonPayload: typeof msg.button?.payload === 'string' ? msg.button.payload : undefined,
          buttonText: typeof msg.button?.text === 'string' ? msg.button.text : undefined,
        });
      }
      const statusRows = Array.isArray((value as { statuses?: unknown }).statuses)
        ? (value as { statuses: unknown[] }).statuses
        : [];
      for (const row of statusRows) {
        if (!row || typeof row !== 'object') continue;
        const st = row as { id?: unknown; status?: unknown };
        if (typeof st.id !== 'string' || typeof st.status !== 'string') continue;
        statuses.push({ wamid: st.id, status: st.status, phoneNumberId });
      }
    }
  }
  const firstWamid = inbounds[0]?.wamid ?? statuses[0]?.wamid ?? null;
  const phoneNumberId = inbounds[0]?.phoneNumberId || statuses[0]?.phoneNumberId || null;
  return { inbounds, statuses, firstWamid, phoneNumberId: phoneNumberId || null };
}

export function parseButtonAction(payload: string | undefined, text: string | undefined): {
  kind: 'CONFIRM' | 'CANCEL' | 'WAITLIST' | 'REBOOK' | 'NONE';
  targetId?: string;
} {
  const value = (payload ?? '').trim();
  if (value.startsWith('CONFIRM_')) return { kind: 'CONFIRM', targetId: value.slice('CONFIRM_'.length) };
  if (value.startsWith('CANCEL_')) return { kind: 'CANCEL', targetId: value.slice('CANCEL_'.length) };
  if (value.startsWith('WAITLIST_')) return { kind: 'WAITLIST', targetId: value.slice('WAITLIST_'.length) };
  if (value.startsWith('REBOOK_')) return { kind: 'REBOOK', targetId: value.slice('REBOOK_'.length) };
  const label = (text ?? '').trim().toLowerCase();
  if (label === 'remarcar' || label === 'reagendar') return { kind: 'REBOOK' };
  return { kind: 'NONE' };
}
