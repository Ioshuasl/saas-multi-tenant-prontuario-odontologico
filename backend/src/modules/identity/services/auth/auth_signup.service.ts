import { assertPasswordPolicy } from '../../../../shared/helpers/password.js';
import { DuplicateEmailError } from '../../models/errors/duplicate_email.error.js';
import { CreateAction } from '../../actions/auth/auth_signup.action.js';
import { GetByEmailRepository } from '../../repositories/user/user.repository.js';
import type { SignupSchema } from '../../schemas/auth.schema.js';
import type { AuthSessionResult } from '../../types/auth.types.js';
import { IssueTokensService } from './auth_session.service.js';

export class CreateService {
  constructor(
    private readonly getByEmail = new GetByEmailRepository(),
    private readonly signupAction = new CreateAction(),
    private readonly issueTokens = new IssueTokensService(),
  ) {}

  async execute(
    signupSchema: SignupSchema,
    meta?: { ipAddress?: string; userAgent?: string },
  ): Promise<AuthSessionResult> {
    assertPasswordPolicy(signupSchema.password);

    const existing = await this.getByEmail.execute(signupSchema.email.toLowerCase());
    if (existing) {
      throw new DuplicateEmailError();
    }

    const created = await this.signupAction.execute({
      email: signupSchema.email,
      password: signupSchema.password,
      clinicName: signupSchema.clinicName,
      ownerName: signupSchema.ownerName,
    });

    return this.issueTokens.execute({
      user: {
        id: created.userId,
        email: created.userEmail,
        name: created.userName,
      },
      membership: {
        id: created.membershipId,
        tenantId: created.tenantId,
        role: created.role,
        permissions: {},
        tenant: {
          id: created.tenantId,
          name: created.tenantName,
          slug: created.tenantSlug,
        },
      },
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });
  }
}
