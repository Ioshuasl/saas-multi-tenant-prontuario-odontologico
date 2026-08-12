import { hashPassword } from '../../../../shared/helpers/password.js';
import { getEmailProvider } from '../../../../shared/integrations/email/index.js';
import { passwordChangedEmailText } from '../../helpers/email_copy.helper.js';
import { MarkUsedRepository } from '../../repositories/password_reset/password_reset.repository.js';
import { UpdatePasswordRepository } from '../../repositories/user/user.repository.js';
import { RevokeAllFamiliesRepository } from '../../repositories/refresh_token/refresh_token.repository.js';

export class ResetAction {
  constructor(
    private readonly markUsed = new MarkUsedRepository(),
    private readonly updatePassword = new UpdatePasswordRepository(),
    private readonly revokeAll = new RevokeAllFamiliesRepository(),
    private readonly email = getEmailProvider(),
  ) {}

  async execute(input: {
    tokenId: string;
    userId: string;
    email: string;
    password: string;
  }): Promise<void> {
    const passwordHash = await hashPassword(input.password);
    await this.updatePassword.execute(input.userId, passwordHash);
    await this.markUsed.execute(input.tokenId);
    await this.revokeAll.execute(input.userId);
    await this.email.send({
      to: input.email,
      subject: 'Sua senha foi alterada',
      text: passwordChangedEmailText(),
    });
  }
}
