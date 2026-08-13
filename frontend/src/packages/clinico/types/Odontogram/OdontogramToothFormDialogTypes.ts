import type { Dentition } from '@/packages/clinico/enum/Odontogram/DentitionEnum';
import type { ToothFace } from '@/packages/clinico/enum/Odontogram/ToothFaceEnum';
import type { OdontogramTooth } from '@/packages/clinico/types/Odontogram/OdontogramTypes';

export type OdontogramSelection = {
  toothCode: string;
  face: ToothFace | null;
};

export type OdontogramToothFormDialogProps = {
  patientId: string;
  dentition: Dentition;
  toothCode: string;
  initialFace?: ToothFace | null;
  teeth: OdontogramTooth[];
  onClose: () => void;
};
