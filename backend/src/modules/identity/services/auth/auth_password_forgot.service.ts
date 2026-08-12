import { getDummyPasswordHash } from '../../../../shared/helpers/password.js';
import { ForgotAction } from '../../actions/auth/auth_password_forgot.action.js';
import { GetByEmailRepository } from '../../repositories/user/user.repository.js';
import type { PasswordForgotSchema } from '../../schemas/auth.schema.js';

export class ForgotService {
  constructor(
    private readonly getByEmail = new GetByEmailRepository(),
    private readonly forgotAction = new ForgotAction(),
  ) {}

  async execute(passwordForgotSchema: PasswordForgotSchema): Promise<{ ok: true }> {
    const email = passwordForgotSchema.email.toLowerCase();
    const user = await this.getByEmail.execute(email);

    if (user) {
      await this.forgotAction.execute(user.id, user.email);
    } else {
      await getDummyPasswordHash();
    }

    return { ok: true };
  }
}
