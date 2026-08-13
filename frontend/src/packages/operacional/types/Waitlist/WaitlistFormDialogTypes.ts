export type WaitlistFormDialogProps = {
  open: boolean;
  professionalId?: string;
  onClose: () => void;
};

export type WaitlistOfferFormDialogProps = {
  open: boolean;
  waitlistId: string;
  professionalId?: string;
  onClose: () => void;
};
