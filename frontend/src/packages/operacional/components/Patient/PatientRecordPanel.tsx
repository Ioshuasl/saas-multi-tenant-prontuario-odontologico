'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { AnamnesisHistoryList } from '@/packages/operacional/components/Anamnesis/AnamnesisHistoryList';
import { ALERT_CATEGORY_LABELS } from '@/packages/operacional/enum/ClinicalAlert/AlertCategoryEnum';
import { ALERT_SEVERITY_LABELS } from '@/packages/operacional/enum/ClinicalAlert/AlertSeverityEnum';
import { formatDateTimePt } from '@/packages/operacional/helpers/AnamnesisAnswer';
import { operacionalErrorMessage } from '@/packages/operacional/helpers/OperacionalErrorMessage';
import { useAnamnesisListHook } from '@/packages/operacional/hooks/Anamnesis/useAnamnesisListHook';
import { useMedicalRecordGetHook } from '@/packages/operacional/hooks/MedicalRecord/useMedicalRecordGetHook';
import type { PatientRecordPanelProps } from '@/packages/operacional/types/Patient/PatientRecordPanelTypes';
import { Can } from '@/shared/auth/Can';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';

const AnamnesisSendLinkFormDialog = dynamic(
  () =>
    import('@/packages/operacional/components/Anamnesis/AnamnesisSendLinkFormDialog').then(
      (m) => m.AnamnesisSendLinkFormDialog,
    ),
  { ssr: false },
);

export function PatientRecordPanel({ patientId }: PatientRecordPanelProps) {
  const [isSendOpen, setIsSendOpen] = useState(false);
  const recordQuery = useMedicalRecordGetHook(patientId);
  const anamnesisQuery = useAnamnesisListHook(patientId);

  if (recordQuery.isLoading || anamnesisQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando prontuário…</p>;
  }

  if (recordQuery.isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{operacionalErrorMessage(recordQuery.error)}</AlertDescription>
      </Alert>
    );
  }

  if (!recordQuery.data) {
    return (
      <Alert>
        <AlertDescription>Prontuário ainda não encontrado para este paciente.</AlertDescription>
      </Alert>
    );
  }

  const record = recordQuery.data;
  const critical = record.alerts.filter((alert) => alert.active && alert.severity === 'CRITICAL');
  const warning = record.alerts.filter((alert) => alert.active && alert.severity === 'WARNING');

  return (
    <div className="grid max-w-3xl gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium">Prontuário</h2>
          <p className="text-sm text-muted-foreground">
            Aberto em {formatDateTimePt(record.openedAt)}
            {record.lastAnamnesisAt
              ? ` · última anamnese ${formatDateTimePt(record.lastAnamnesisAt)}`
              : ' · sem anamnese'}
          </p>
        </div>
        <Can permission="clinical_records.write">
          <Button type="button" onClick={() => setIsSendOpen(true)}>
            Enviar anamnese
          </Button>
        </Can>
      </div>

      {record.anamnesisStale ? (
        <Alert>
          <AlertTitle>Anamnese desatualizada</AlertTitle>
          <AlertDescription>
            Não há resposta nos últimos 12 meses. Envie o link para o paciente atualizar.
          </AlertDescription>
        </Alert>
      ) : null}

      {critical.map((alert) => (
        <Alert key={alert.id} variant="destructive">
          <AlertTitle>
            {ALERT_SEVERITY_LABELS[alert.severity as keyof typeof ALERT_SEVERITY_LABELS] ?? alert.severity}{' '}
            · {ALERT_CATEGORY_LABELS[alert.category as keyof typeof ALERT_CATEGORY_LABELS] ?? alert.category}
          </AlertTitle>
          <AlertDescription>{alert.description}</AlertDescription>
        </Alert>
      ))}

      {warning.length > 0 ? (
        <div className="grid gap-2">
          {warning.map((alert) => (
            <Alert key={alert.id}>
              <AlertTitle>
                {ALERT_SEVERITY_LABELS[alert.severity as keyof typeof ALERT_SEVERITY_LABELS] ??
                  alert.severity}
              </AlertTitle>
              <AlertDescription>{alert.description}</AlertDescription>
            </Alert>
          ))}
        </div>
      ) : null}

      {record.alerts.filter((alert) => alert.active && alert.severity === 'INFO').map((alert) => (
        <Badge key={alert.id} variant="outline">
          {alert.description}
        </Badge>
      ))}

      <div className="grid gap-2">
        <h3 className="text-sm font-medium">Histórico de anamnese</h3>
        {anamnesisQuery.isError ? (
          <Alert variant="destructive">
            <AlertDescription>{operacionalErrorMessage(anamnesisQuery.error)}</AlertDescription>
          </Alert>
        ) : (
          <AnamnesisHistoryList items={anamnesisQuery.data ?? []} />
        )}
      </div>

      {isSendOpen ? (
        <AnamnesisSendLinkFormDialog patientId={patientId} onClose={() => setIsSendOpen(false)} />
      ) : null}
    </div>
  );
}
