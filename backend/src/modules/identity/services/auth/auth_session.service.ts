import { randomBytes } from 'node:crypto';
import { signAccessToken } from '../../../../shared/auth/jwt.js';
import { env } from '../../../../shared/config/env.js';
import type { IdGenerator } from '../../../../shared/helpers/id_generator.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import { hashToken } from '../../../../shared/helpers/token_hash.js';
import { Role } from '../../enum/role/role.enum.js';
import { resolvePermissions, type PermissionOverrides } from '../../enum/role/permission.enum.js';
import type { Role as RoleType } from '../../enum/role/role.enum.js';
import { addDays } from '../../helpers/slug.helper.js';
import type { MembershipRow } from '../../repositories/membership/membership.repository.js';
import {
  CreateRepository as CreateRefreshTokenRepository,
} from '../../repositories/refresh_token/refresh_token.repository.js';
import type { AuthSessionResult } from '../../types/auth.types.js';

export class IssueTokensService {
  constructor(
    private readonly ids: IdGenerator = idGenerator,
    private readonly createRefreshToken = new CreateRefreshTokenRepository(),
  ) {}

  async execute(input: {
    user: { id: string; email: string; name: string };
    membership: Pick<MembershipRow, 'id' | 'tenantId' | 'role' | 'permissions'> & {
      tenant: { id: string; name: string; slug: string };
    };
    familyId?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<AuthSessionResult> {
    const permissions = resolvePermissions(
      input.membership.role as RoleType,
      input.membership.permissions as PermissionOverrides,
    );

    const accessToken = await signAccessToken({
      userId: input.user.id,
      tenantId: input.membership.tenantId,
      membershipId: input.membership.id,
      role: input.membership.role,
      permissions,
    });

    const refreshToken = randomBytes(32).toString('base64url');
    const refreshTokenId = this.ids.next();
    const familyId = input.familyId ?? this.ids.next();
    const expiresAt = addDays(new Date(), env.REFRESH_TOKEN_TTL_DAYS);

    await this.createRefreshToken.execute({
      id: refreshTokenId,
      userId: input.user.id,
      membershipId: input.membership.id,
      familyId,
      tokenHash: hashToken(refreshToken),
      expiresAt,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: input.user.id,
        email: input.user.email,
        name: input.user.name,
      },
      tenant: {
        id: input.membership.tenant.id,
        name: input.membership.tenant.name,
        slug: input.membership.tenant.slug,
      },
      membership: {
        id: input.membership.id,
        role: input.membership.role,
      },
    };
  }
}

export function pickPreferredMembership(memberships: MembershipRow[]): MembershipRow | null {
  if (memberships.length === 0) return null;
  return memberships.find((m) => m.role === Role.OWNER) ?? memberships[0] ?? null;
}
