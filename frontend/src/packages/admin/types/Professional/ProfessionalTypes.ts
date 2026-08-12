export type ProfessionalSummary = {
  id: string;
  membershipId: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  croNumber: string | null;
  croState: string | null;
  specialties: string[];
  color: string | null;
  active: boolean;
};
