import type {
  MessagingProvider,
  SendResult,
  SendTemplateInput,
  SendTextInput,
} from '../../../modules/messaging/types/ports/messaging_provider.port.js';

const GRAPH_BASE = 'https://graph.facebook.com/v21.0';

export class WhatsAppCloudProvider implements MessagingProvider {
  async sendTemplate(input: SendTemplateInput): Promise<SendResult> {
    const components: unknown[] = [];
    const params = Object.values(input.variables).map((text) => ({ type: 'text', text }));
    if (params.length > 0) {
      components.push({ type: 'body', parameters: params });
    }
    if (input.buttonPayload) {
      components.push({
        type: 'button',
        sub_type: 'quick_reply',
        index: '0',
        parameters: [{ type: 'payload', payload: input.buttonPayload }],
      });
    }
    return this.post(input.phoneNumberId, input.accessToken, {
      messaging_product: 'whatsapp',
      to: input.to,
      type: 'template',
      template: {
        name: input.templateName,
        language: { code: input.language },
        ...(components.length > 0 ? { components } : {}),
      },
    });
  }

  async sendText(input: SendTextInput): Promise<SendResult> {
    return this.post(input.phoneNumberId, input.accessToken, {
      messaging_product: 'whatsapp',
      to: input.to,
      type: 'text',
      text: { body: input.body },
    });
  }

  private async post(
    phoneNumberId: string,
    accessToken: string,
    payload: unknown,
  ): Promise<SendResult> {
    const response = await fetch(`${GRAPH_BASE}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${accessToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const json = (await response.json()) as { messages?: Array<{ id?: string }>; error?: { message?: string } };
    if (!response.ok) {
      throw new Error(json.error?.message ?? `WhatsApp Cloud HTTP ${response.status}`);
    }
    const id = json.messages?.[0]?.id;
    if (!id) throw new Error('WhatsApp Cloud não retornou wamid.');
    return { providerMessageId: id };
  }
}
