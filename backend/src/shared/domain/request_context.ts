export type RequestContext = {
  tenantId: string;
  userId: string;
  requestId: string;
  membershipId?: string;
  role?: string;
  permissions?: readonly string[];
};
