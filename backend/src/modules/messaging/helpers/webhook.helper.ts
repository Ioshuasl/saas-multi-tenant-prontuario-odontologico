import { createHmac, timingSafeEqual } from 'node:crypto';
import { fromWahaChatId } from './waha_session.helper.js';

export function verifyWahaHmac(rawBody: Buffer, signatureHeader: string | undefined, secret: string): boolean {
  if (!signatureHeader) return false;
  const expectedHex = createHmac('sha512', secret).update(rawBody).digest('hex');
  const actual = signatureHeader.trim().toLowerCase().replace(/^sha512=/i, '');
  if (expectedHex.length !== actual.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expectedHex, 'utf8'), Buffer.from(actual, 'utf8'));
  } catch {
    return false;
  }
}

export type WebhookInbound = {
  wamid: string;
  from: string;
  sessionName: string;
  type: string;
  text?: string;
  buttonPayload?: string;
  buttonText?: string;
};

export type WebhookStatus = {
  wamid: string;
  status: string;
  sessionName: string;
};

export type WebhookSession = {
  sessionName: string;
  status: string;
  displayPhone: string | null;
};

export type ParsedWhatsappWebhook = {
  sessionName: string | null;
  inbounds: WebhookInbound[];
  statuses: WebhookStatus[];
  session: WebhookSession | null;
  firstWamid: string | null;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function ackToStatus(ack: unknown): string | null {
  if (ack === 1 || ack === '1') return 'sent';
  if (ack === 2 || ack === '2') return 'delivered';
  if (ack === 3 || ack === '3') return 'read';
  if (typeof ack === 'string') return ack.toLowerCase();
  return null;
}

export function parseWhatsappWebhook(body: unknown): ParsedWhatsappWebhook {
  const inbounds: WebhookInbound[] = [];
  const statuses: WebhookStatus[] = [];
  const root = asRecord(body);
  if (!root) {
    return { sessionName: null, inbounds, statuses, session: null, firstWamid: null };
  }
  const sessionName = typeof root.session === 'string' ? root.session : null;
  const event = typeof root.event === 'string' ? root.event : '';
  const payload = asRecord(root.payload) ?? {};

  let session: WebhookSession | null = null;
  if (event === 'session.status' && sessionName) {
    const status = typeof payload.status === 'string' ? payload.status : '';
    const me = asRecord(payload.me);
    const meId = typeof me?.id === 'string' ? fromWahaChatId(me.id) : null;
    session = { sessionName, status, displayPhone: meId };
  }

  if ((event === 'message' || event === 'message.any') && sessionName) {
    const fromMe = payload.fromMe === true;
    const id = typeof payload.id === 'string' ? payload.id : '';
    const from = typeof payload.from === 'string' ? fromWahaChatId(payload.from) : '';
    if (!fromMe && id && from) {
      const button = asRecord(payload.button);
      inbounds.push({
        wamid: id,
        from,
        sessionName,
        type: typeof payload.type === 'string' ? payload.type : 'text',
        text: typeof payload.body === 'string' ? payload.body : undefined,
        buttonPayload: typeof button?.payload === 'string' ? button.payload : undefined,
        buttonText: typeof button?.text === 'string' ? button.text : undefined,
      });
    }
  }

  if (event === 'message.ack' && sessionName) {
    const id = typeof payload.id === 'string' ? payload.id : '';
    const mapped = ackToStatus(payload.ack);
    if (id && mapped) {
      statuses.push({ wamid: id, status: mapped, sessionName });
    }
  }

  const firstWamid = inbounds[0]?.wamid ?? statuses[0]?.wamid ?? null;
  return { sessionName, inbounds, statuses, session, firstWamid };
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
  const label = (text ?? '').trim().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
  if (label === 'confirmar' || label.startsWith('confirmar')) return { kind: 'CONFIRM' };
  if (label === 'cancelar' || label.startsWith('cancelar')) return { kind: 'CANCEL' };
  if (label.includes('quero este horario') || label === 'quero este horário') return { kind: 'WAITLIST' };
  if (label === 'remarcar' || label === 'reagendar') return { kind: 'REBOOK' };
  return { kind: 'NONE' };
}
