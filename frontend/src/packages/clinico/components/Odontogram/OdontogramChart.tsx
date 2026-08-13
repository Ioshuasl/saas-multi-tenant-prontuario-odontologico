'use client';

import { OdontogramReferenceChart } from '@/packages/clinico/components/Odontogram/OdontogramReferenceChart';
import { OdontogramToothSvg } from '@/packages/clinico/components/Odontogram/OdontogramToothSvg';
import { TOOTH_FACE_LABELS, type ToothFace } from '@/packages/clinico/enum/Odontogram/ToothFaceEnum';
import { odontogramRows } from '@/packages/clinico/helpers/OdontogramFdi';
import type { Dentition } from '@/packages/clinico/enum/Odontogram/DentitionEnum';
import type { OdontogramTooth } from '@/packages/clinico/types/Odontogram/OdontogramTypes';
import { cn } from '@/shared/helpers/utils';

type OdontogramChartProps = {
  dentition: Dentition;
  teeth: OdontogramTooth[];
  onSelect: (toothCode: string, face: ToothFace | null) => void;
};

export function OdontogramChart({ dentition, teeth, onSelect }: OdontogramChartProps) {
  if (dentition === 'PERMANENT') {
    return <OdontogramReferenceChart teeth={teeth} onSelect={onSelect} />;
  }

  const rows = odontogramRows(dentition);
  const midline = 5;
  const quadrantClass = 'grid-cols-5';

  const renderArch = (codes: string[]) => (
    <div className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-x-2">
      <div className={cn('grid min-w-0 gap-x-0.5', quadrantClass)}>
        {codes.slice(0, midline).map((code) => (
          <OdontogramToothSvg key={code} toothCode={code} teeth={teeth} onSelect={onSelect} />
        ))}
      </div>
      <span className="w-px shrink-0 self-stretch bg-transparent" aria-hidden />
      <div className={cn('grid min-w-0 gap-x-0.5', quadrantClass)}>
        {codes.slice(midline).map((code) => (
          <OdontogramToothSvg key={code} toothCode={code} teeth={teeth} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="grid min-w-0 gap-1">
      {renderArch(rows.upper)}
      <div className="mx-2 border-t border-dashed border-[#9aa8b4]" aria-hidden />
      {renderArch(rows.lower)}
      <p className="mt-2 text-xs text-muted-foreground">
        Clique na coroa (faces {TOOTH_FACE_LABELS.M} · {TOOTH_FACE_LABELS.D} · {TOOTH_FACE_LABELS.V} ·{' '}
        {TOOTH_FACE_LABELS.L} · {TOOTH_FACE_LABELS.O} · {TOOTH_FACE_LABELS.C}) ou no número FDI para o
        dente inteiro.
      </p>
    </div>
  );
}
