export type PatientFormDialogProps = {
  open: boolean;
  onClose: () => void;
  onCreated?: (patientId: string) => void;
};
