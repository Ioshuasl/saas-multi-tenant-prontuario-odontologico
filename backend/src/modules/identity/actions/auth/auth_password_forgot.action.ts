import { randomBytes } from 'node:crypto';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import { hashToken } from '../../../../shared/helpers/token_hash.js';
import { getEmailProvider } from '../../../../shared/integrations/email/index.js';
import { passwordResetEmailText } from '../../helpers/email_copy.helper.js';
import { addHours } from '../../helpers/slug.helper.js';
import {
  CreateRepository,
  InvalidateOpenByUserRepository,
} from '../../repositories/password_reset/password_reset.repository.js';

export class ForgotAction {
  constructor(
    private readonly invalidateOpen = new InvalidateOpenByUserRepository(),
    private readonly createToken = new CreateRepository(),
    private readonly email = getEmailProvider(),
  ) {}

  async execute(userId: string, email: string): Promise<void> {
    const rawToken = randomBytes(32).toString('base64url');
    await this.invalidateOpen.execute(userId);
    await this.createToken.execute({
      id: idGenerator.next(),
      userId,
      tokenHash: hashToken(rawToken),
      expiresAt: addHours(new Date(), 1),
    });

    await this.email.send({
      to: email,
      subject: 'Redefinição de senha',
      text: passwordResetEmailText(rawToken),
    });
  }
}
