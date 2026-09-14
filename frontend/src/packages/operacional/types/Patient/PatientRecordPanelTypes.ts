export type PatientRecordPanelProps = {
  patientId: string;
  sendOpen?: boolean;
  onSendOpenChange?: (open: boolean) => void;
  hideHeaderSend?: boolean;
};
