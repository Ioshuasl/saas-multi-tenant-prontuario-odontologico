export type AuthUserSummary = {
  id: string;
  email: string;
  name: string;
};

export type AuthTenantSummary = {
  id: string;
  name: string;
  slug: string;
};

export type AuthMembershipSummary = {
  id: string;
  role: string;
};

export type AuthSessionResult = {
  accessToken: string;
  refreshToken: string;
  user: AuthUserSummary;
  tenant: AuthTenantSummary;
  membership: AuthMembershipSummary;
};

export type AuthRefreshResult = {
  accessToken: string;
};

export type AuthMeMembership = {
  id: string;
  tenantId: string;
  role: string;
  active: boolean;
  permissions: string[];
  tenant: AuthTenantSummary;
};

export type AuthMeResult = {
  user: AuthUserSummary;
  memberships: AuthMeMembership[];
  current: {
    tenantId: string;
    membershipId: string;
    role: string;
    permissions: string[];
  };
};

export type InvitationSummary = {
  id: string;
  email: string;
  role: string;
  expiresAt: Date;
  acceptedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
};

export type MemberSummary = {
  id: string;
  membershipId: string;
  email: string;
  name: string;
  role: string;
  active: boolean;
  defaultUnitId: string | null;
  permissions: unknown;
};

export type SignupActionResult = {
  tenantId: string;
  userId: string;
  membershipId: string;
  tenantName: string;
  tenantSlug: string;
  userEmail: string;
  userName: string;
  role: string;
};
