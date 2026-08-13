import type { ChairOption, ProfessionalOption } from '@/packages/operacional/types/Appointment/AppointmentTypes';

export type AppointmentFormDialogProps = {
  open: boolean;
  professionalId?: string;
  chairId?: string | null;
  professionals?: ProfessionalOption[];
  chairs?: ChairOption[];
  startsAt: string;
  endsAt: string;
  onClose: () => void;
};
