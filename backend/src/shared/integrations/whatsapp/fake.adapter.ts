import { randomUUID } from 'node:crypto';
import type {
  MessagingProvider,
  SendResult,
  SendTemplateInput,
  SendTextInput,
} from '../../../modules/messaging/types/ports/messaging_provider.port.js';

export class FakeMessagingProvider implements MessagingProvider {
  readonly sentTemplates: SendTemplateInput[] = [];
  readonly sentTexts: SendTextInput[] = [];

  async sendTemplate(input: SendTemplateInput): Promise<SendResult> {
    if (input.accessToken === 'invalid') {
      throw new Error('INVALID_TOKEN');
    }
    this.sentTemplates.push(input);
    return { providerMessageId: `wamid.fake.${randomUUID()}` };
  }

  async sendText(input: SendTextInput): Promise<SendResult> {
    if (input.accessToken === 'invalid') {
      throw new Error('INVALID_TOKEN');
    }
    this.sentTexts.push(input);
    return { providerMessageId: `wamid.fake.${randomUUID()}` };
  }
}
