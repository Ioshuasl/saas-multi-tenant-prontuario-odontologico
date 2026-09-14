export type PatientFormDrawerProps = {
  open: boolean;
  onClose: () => void;
  onCreated?: (patientId: string) => void;
};

/** @deprecated Use PatientFormDrawerProps */
export type PatientFormDialogProps = PatientFormDrawerProps;
