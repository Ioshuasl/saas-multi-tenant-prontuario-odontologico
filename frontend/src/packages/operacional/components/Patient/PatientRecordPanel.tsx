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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';

const AnamnesisSendLinkFormDialog = dynamic(
  () =>
    import('@/packages/operacional/components/Anamnesis/AnamnesisSendLinkFormDialog').then(
      (m) => m.AnamnesisSendLinkFormDialog,
    ),
  { ssr: false },
);

export function PatientRecordPanel({
  patientId,
  sendOpen,
  onSendOpenChange,
  hideHeaderSend = false,
}: PatientRecordPanelProps) {
  const [internalSendOpen, setInternalSendOpen] = useState(false);
  const isSendOpen = sendOpen ?? internalSendOpen;
  const setIsSendOpen = onSendOpenChange ?? setInternalSendOpen;

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
    <Card>
      <CardHeader className="border-b border-border">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Prontuário clínico</CardTitle>
            <CardDescription>
              Aberto em {formatDateTimePt(record.openedAt)}
              {record.lastAnamnesisAt
                ? ` · última anamnese ${formatDateTimePt(record.lastAnamnesisAt)}`
                : ' · sem anamnese'}
            </CardDescription>
          </div>
          {!hideHeaderSend ? (
            <Can permission="clinical_records.write">
              <Button
                type="button"
                className="cursor-pointer"
                onClick={() => setIsSendOpen(true)}
              >
                Enviar anamnese
              </Button>
            </Can>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
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
              {ALERT_SEVERITY_LABELS[alert.severity as keyof typeof ALERT_SEVERITY_LABELS] ??
                alert.severity}{' '}
              ·{' '}
              {ALERT_CATEGORY_LABELS[alert.category as keyof typeof ALERT_CATEGORY_LABELS] ??
                alert.category}
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

        {record.alerts
          .filter((alert) => alert.active && alert.severity === 'INFO')
          .map((alert) => (
            <Badge key={alert.id} variant="outline">
              {alert.description}
            </Badge>
          ))}

        <div className="grid gap-2">
          <h3 className="text-sm font-semibold text-foreground">Histórico de anamnese</h3>
          {anamnesisQuery.isError ? (
            <Alert variant="destructive">
              <AlertDescription>{operacionalErrorMessage(anamnesisQuery.error)}</AlertDescription>
            </Alert>
          ) : (
            <AnamnesisHistoryList items={anamnesisQuery.data ?? []} />
          )}
        </div>

        <div className="rounded-lg bg-muted/50 px-4 py-4">
          <p className="text-sm font-semibold text-foreground">Odontograma</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Visualização clínica completa no modo Atendimento. Aqui: alertas e histórico.
          </p>
        </div>
      </CardContent>

      {isSendOpen ? (
        <AnamnesisSendLinkFormDialog
          patientId={patientId}
          onClose={() => setIsSendOpen(false)}
        />
      ) : null}
    </Card>
  );
}
