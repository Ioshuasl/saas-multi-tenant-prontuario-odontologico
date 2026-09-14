export type PatientQuotesPanelProps = {
  patientId: string;
  createOpen?: boolean;
  onCreateOpenChange?: (open: boolean) => void;
  hideHeaderCreate?: boolean;
};
