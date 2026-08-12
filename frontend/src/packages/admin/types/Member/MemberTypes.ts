export type MemberSummary = {
  id: string;
  membershipId: string;
  email: string;
  name: string;
  role: string;
  active: boolean;
  defaultUnitId: string | null;
  permissions: string[];
};

export type InvitationSummary = {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
};
