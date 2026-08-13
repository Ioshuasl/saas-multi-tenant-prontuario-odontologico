'use client';

import { ALERT_CATEGORY_LABELS } from '@/packages/clinico/enum/ClinicalAlert/AlertCategoryEnum';
import { ALERT_SEVERITY_LABELS } from '@/packages/clinico/enum/ClinicalAlert/AlertSeverityEnum';
import type { ClinicalAlertSummary } from '@/packages/clinico/types/MedicalRecord/MedicalRecordTypes';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Badge } from '@/shared/ui/badge';

type AttendanceHeaderProps = {
  patientName: string;
  age: number | null;
  anamnesisStale?: boolean;
  alerts: ClinicalAlertSummary[];
};

export function AttendanceHeader({
  patientName,
  age,
  anamnesisStale,
  alerts,
}: AttendanceHeaderProps) {
  const active = alerts.filter((alert) => alert.active);
  const critical = active.filter((alert) => alert.severity === 'CRITICAL');
  const warning = active.filter((alert) => alert.severity === 'WARNING');

  return (
    <header className="grid gap-3">
      <div>
        <p className="text-sm text-muted-foreground">Atendimento</p>
        <h1 className="text-xl font-semibold">
          {patientName}
          {age != null ? ` · ${age}a` : ''}
        </h1>
      </div>

      {anamnesisStale ? (
        <Alert>
          <AlertTitle>Anamnese desatualizada</AlertTitle>
          <AlertDescription>Sem resposta nos últimos 12 meses.</AlertDescription>
        </Alert>
      ) : null}

      {critical.map((alert) => (
        <Alert key={alert.id} variant="destructive">
          <AlertTitle>
            {ALERT_SEVERITY_LABELS[alert.severity as keyof typeof ALERT_SEVERITY_LABELS] ?? alert.severity}
            {' · '}
            {ALERT_CATEGORY_LABELS[alert.category as keyof typeof ALERT_CATEGORY_LABELS] ?? alert.category}
          </AlertTitle>
          <AlertDescription>{alert.description}</AlertDescription>
        </Alert>
      ))}

      {warning.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {warning.map((alert) => (
            <Badge key={alert.id} variant="outline">
              {ALERT_SEVERITY_LABELS[alert.severity as keyof typeof ALERT_SEVERITY_LABELS] ?? alert.severity}
              {': '}
              {alert.description}
            </Badge>
          ))}
        </div>
      ) : null}
    </header>
  );
}
