'use client';

import { useMemo, useState } from 'react';
import {
  EXPORTABLE_REPORTS,
  EXPORTABLE_REPORT_LABELS,
  type ExportableReport,
} from '@/packages/admin/enum/Report/ExportableReportEnum';
import { EXPORT_STATUS_LABELS } from '@/packages/admin/enum/Report/ExportStatusEnum';
import { adminErrorMessage } from '@/packages/admin/helpers/AdminErrorMessage';
import { useReportExportCreateHook } from '@/packages/admin/hooks/Report/useReportExportCreateHook';
import { useReportExportGetHook } from '@/packages/admin/hooks/Report/useReportExportGetHook';
import { useAuth } from '@/shared/auth/AuthProvider';
import { hasPermission } from '@/shared/auth/permissions';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { NativeSelect, NativeSelectOption } from '@/shared/ui/native-select';

function monthRange(): { from: string; to: string } {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  return { from, to };
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

type ReportExportPanelProps = {
  defaultReport?: ExportableReport;
};

export function ReportExportPanel({ defaultReport = 'dashboard' }: ReportExportPanelProps) {
  const { me } = useAuth();
  const canFinancial = hasPermission(me, 'reports.financial');
  const initial = monthRange();
  const [report, setReport] = useState<ExportableReport>(defaultReport);
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [date, setDate] = useState(todayIso());
  const [exportId, setExportId] = useState<string | null>(null);

  const create = useReportExportCreateHook();
  const exportQuery = useReportExportGetHook(exportId);

  const availableReports = useMemo(
    () =>
      EXPORTABLE_REPORTS.filter((item) => {
        if (item === 'no-shows' || item === 'revenue') return canFinancial;
        return true;
      }),
    [canFinancial],
  );

  const onExport = () => {
    const body =
      report === 'dashboard'
        ? { format: 'CSV' as const, date }
        : { format: 'CSV' as const, from, to };
    create.mutate(
      { report, body },
      {
        onSuccess: (result) => {
          setExportId(result.exportId);
        },
      },
    );
  };

  const status = exportQuery.data?.status;
  const downloadUrl = exportQuery.data?.downloadUrl;

  return (
    <div className="grid gap-3 rounded-xl border p-4" data-testid="report-export-panel">
      <div className="grid gap-1">
        <h2 className="text-base font-medium">Exportar CSV</h2>
        <p className="text-sm text-muted-foreground">
          O arquivo é gerado em segundo plano. Quando ficar pronto, abra o link (válido por 15
          minutos).
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <NativeSelect
          aria-label="Relatório"
          className="w-52"
          value={report}
          onChange={(event) => setReport(event.target.value as ExportableReport)}
        >
          {availableReports.map((item) => (
            <NativeSelectOption key={item} value={item}>
              {EXPORTABLE_REPORT_LABELS[item]}
            </NativeSelectOption>
          ))}
        </NativeSelect>

        {report === 'dashboard' ? (
          <Input
            type="date"
            aria-label="Data do dashboard"
            className="w-40"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        ) : (
          <>
            <Input
              type="date"
              aria-label="De"
              className="w-40"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
            />
            <Input
              type="date"
              aria-label="Até"
              className="w-40"
              value={to}
              onChange={(event) => setTo(event.target.value)}
            />
          </>
        )}

        <Button
          type="button"
          className="cursor-pointer"
          disabled={create.isPending}
          onClick={onExport}
        >
          {create.isPending ? 'Solicitando…' : 'Exportar'}
        </Button>
      </div>

      {create.isError ? (
        <Alert variant="destructive">
          <AlertDescription>{adminErrorMessage(create.error)}</AlertDescription>
        </Alert>
      ) : null}

      {exportId ? (
        <Alert>
          <AlertTitle>
            Status: {status ? EXPORT_STATUS_LABELS[status] : 'Consultando…'}
          </AlertTitle>
          <AlertDescription className="grid gap-2">
            {exportQuery.isError ? adminErrorMessage(exportQuery.error) : null}
            {status === 'FAILED' ? exportQuery.data?.error ?? 'Falha ao gerar o arquivo.' : null}
            {status === 'READY' && downloadUrl ? (
              <a
                href={downloadUrl}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-primary underline"
              >
                Baixar CSV
              </a>
            ) : null}
            {status === 'PENDING' || status === 'RUNNING' ? (
              <span className="text-muted-foreground">Aguardando o arquivo ficar pronto…</span>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
