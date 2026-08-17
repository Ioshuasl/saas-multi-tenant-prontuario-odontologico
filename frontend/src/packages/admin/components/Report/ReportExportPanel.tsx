'use client';

import { useState } from 'react';
import { EXPORT_REPORT_LABELS, type ExportReport } from '@/packages/admin/enum/Report/ExportEnum';
import { adminErrorMessage } from '@/packages/admin/helpers/AdminErrorMessage';
import { useExportCreateHook } from '@/packages/admin/hooks/Export/useExportCreateHook';
import { useExportFormHook } from '@/packages/admin/hooks/Export/useExportFormHook';
import { useExportGetHook } from '@/packages/admin/hooks/Export/useExportGetHook';
import type { ExportCreateFormValues } from '@/packages/admin/schemas/Export/ExportSchema';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { NativeSelect, NativeSelectOption } from '@/shared/ui/native-select';

type ReportExportPanelProps = {
  allowRevenue: boolean;
};

export function ReportExportPanel({ allowRevenue }: ReportExportPanelProps) {
  const form = useExportFormHook();
  const create = useExportCreateHook();
  const [exportId, setExportId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const exportQuery = useExportGetHook(exportId);
  const reports: ExportReport[] = allowRevenue
    ? ['no-shows', 'revenue', 'procedures']
    : ['no-shows', 'procedures'];

  const onExport = async (values: ExportCreateFormValues) => {
    setCopied(false);
    const result = await create.mutateAsync({
      report: values.report,
      exportCreateSchema: { format: 'CSV', from: values.from, to: values.to },
    });
    setExportId(result.exportId);
  };

  const onCopy = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exportar CSV</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-3 sm:grid-cols-4"
          onSubmit={(e) => {
            void form.handleSubmit(onExport)(e);
          }}
        >
          <NativeSelect
            aria-label="Relatório"
            className="w-full"
            value={form.watch('report')}
            onChange={(e) => form.setValue('report', e.target.value as ExportReport)}
          >
            {reports.map((item) => (
              <NativeSelectOption key={item} value={item}>
                {EXPORT_REPORT_LABELS[item]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <Input type="date" aria-label="De" {...form.register('from')} />
          <Input type="date" aria-label="Até" {...form.register('to')} />
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? 'Solicitando…' : 'Exportar CSV'}
          </Button>
        </form>

        {create.isError ? (
          <Alert variant="destructive" className="mt-3">
            <AlertDescription>{adminErrorMessage(create.error)}</AlertDescription>
          </Alert>
        ) : null}

        {exportQuery.data ? (
          <div className="mt-3 grid gap-2 text-sm">
            {exportQuery.data.status === 'PENDING' || exportQuery.data.status === 'RUNNING' ? (
              <p className="text-muted-foreground">Gerando arquivo…</p>
            ) : null}
            {exportQuery.data.status === 'FAILED' ? (
              <Alert variant="destructive">
                <AlertDescription>{exportQuery.data.error || 'Falha ao gerar o arquivo.'}</AlertDescription>
              </Alert>
            ) : null}
            {exportQuery.data.status === 'READY' && exportQuery.data.url ? (
              <ReadyCsvActions
                url={exportQuery.data.url}
                copied={copied}
                onCopy={onCopy}
              />
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ReadyCsvActions({
  url,
  copied,
  onCopy,
}: {
  url: string;
  copied: boolean;
  onCopy: (url: string) => Promise<void>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        nativeButton={false}
        render={<a href={url} target="_blank" rel="noreferrer" />}
      >
        Baixar CSV
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          void onCopy(url);
        }}
      >
        {copied ? 'URL copiada' : 'Copiar URL'}
      </Button>
    </div>
  );
}
