export type AuthUser = {
  id: string;
  email: string;
  name: string;
};

export type AuthTenant = {
  id: string;
  name: string;
  slug: string;
};

export type AuthMembership = {
  id: string;
  role: string;
};

export type AuthSession = {
  accessToken: string;
  user: AuthUser;
  tenant: AuthTenant;
  membership: AuthMembership;
};

export type AuthMe = {
  user: AuthUser;
  memberships: Array<{
    id: string;
    tenantId: string;
    role: string;
    active: boolean;
    permissions: string[];
    tenant: AuthTenant;
  }>;
  current: {
    tenantId: string;
    membershipId: string;
    role: string;
    permissions: string[];
  };
};
