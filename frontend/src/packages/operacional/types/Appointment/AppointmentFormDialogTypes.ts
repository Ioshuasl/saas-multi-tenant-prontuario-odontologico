import type { ChairOption, ProfessionalOption } from '@/packages/operacional/types/Appointment/AppointmentTypes';

export type AppointmentFormDialogProps = {
  open: boolean;
  professionalId?: string;
  /** Passado silenciosamente quando a grade está filtrada por cadeira. */
  chairId?: string | null;
  professionals?: ProfessionalOption[];
  /** @deprecated Campo de cadeira oculto no formulário; mantido só por compat. */
  chairs?: ChairOption[];
  startsAt: string;
  endsAt: string;
  onClose: () => void;
};
