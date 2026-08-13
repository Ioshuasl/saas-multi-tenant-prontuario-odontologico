'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { OdontogramChart } from '@/packages/clinico/components/Odontogram/OdontogramChart';
import {
  DENTITIONS,
  DENTITION_LABELS,
  type Dentition,
} from '@/packages/clinico/enum/Odontogram/DentitionEnum';
import {
  TOOTH_CONDITIONS,
  TOOTH_CONDITION_CLASS,
  TOOTH_CONDITION_LABELS,
} from '@/packages/clinico/enum/Odontogram/ToothConditionEnum';
import { clinicoErrorMessage } from '@/packages/clinico/helpers/ClinicoErrorMessage';
import { useOdontogramGetHook } from '@/packages/clinico/hooks/Odontogram/useOdontogramGetHook';
import type { OdontogramSelection } from '@/packages/clinico/types/Odontogram/OdontogramToothFormDialogTypes';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

const OdontogramToothFormDialog = dynamic(
  () =>
    import('@/packages/clinico/components/Odontogram/OdontogramToothFormDialog').then(
      (m) => m.OdontogramToothFormDialog,
    ),
  { ssr: false },
);

type OdontogramPanelProps = {
  patientId: string;
};

export function OdontogramPanel({ patientId }: OdontogramPanelProps) {
  const [dentition, setDentition] = useState<Dentition>('PERMANENT');
  const [selected, setSelected] = useState<OdontogramSelection | null>(null);
  const odontogramQuery = useOdontogramGetHook(patientId, dentition);

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base">Odontograma</CardTitle>
        <div className="flex gap-1">
          {DENTITIONS.map((item) => (
            <Button
              key={item}
              type="button"
              size="sm"
              variant={dentition === item ? 'default' : 'outline'}
              onClick={() => setDentition(item)}
            >
              {DENTITION_LABELS[item]}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="grid min-w-0 gap-4">
        {odontogramQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando odontograma…</p>
        ) : odontogramQuery.isError ? (
          <Alert variant="destructive">
            <AlertDescription>{clinicoErrorMessage(odontogramQuery.error)}</AlertDescription>
          </Alert>
        ) : (
          <OdontogramChart
            dentition={dentition}
            teeth={odontogramQuery.data?.teeth ?? []}
            onSelect={(toothCode, face) => setSelected({ toothCode, face })}
          />
        )}
        <div className="flex flex-wrap gap-2 text-xs">
          {TOOTH_CONDITIONS.map((condition) => (
            <span
              key={condition}
              className={`rounded border px-1.5 py-0.5 ${TOOTH_CONDITION_CLASS[condition]}`}
            >
              {TOOTH_CONDITION_LABELS[condition]}
            </span>
          ))}
        </div>
      </CardContent>
      {selected ? (
        <OdontogramToothFormDialog
          patientId={patientId}
          dentition={dentition}
          toothCode={selected.toothCode}
          initialFace={selected.face}
          teeth={odontogramQuery.data?.teeth ?? []}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </Card>
  );
}
