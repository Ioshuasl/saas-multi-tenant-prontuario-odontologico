export type ScheduleBlockFormDialogProps = {
  open: boolean;
  professionalId?: string | null;
  chairId?: string | null;
  startsAt: string;
  endsAt: string;
  onClose: () => void;
};
