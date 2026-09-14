'use client';

import { useState } from 'react';
import { adminErrorMessage } from '@/packages/admin/helpers/AdminErrorMessage';
import { useTenantExportCreateHook } from '@/packages/admin/hooks/TenantExport/useTenantExportCreateHook';
import { useTenantExportGetHook } from '@/packages/admin/hooks/TenantExport/useTenantExportGetHook';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

export function TenantExportPanel() {
  const create = useTenantExportCreateHook();
  const [exportId, setExportId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const exportQuery = useTenantExportGetHook(exportId);

  const onExport = async () => {
    setCopied(false);
    const result = await create.mutateAsync();
    setExportId(result.exportId);
  };

  const onCopy = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exportar dados da clínica</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <p className="text-sm text-muted-foreground">
          O arquivo contém dados de pacientes. Trate-o como confidencial.
        </p>
        <Button
          type="button"
          className="w-fit"
          disabled={create.isPending}
          onClick={() => {
            void onExport();
          }}
        >
          {create.isPending ? 'Solicitando…' : 'Exportar dados da clínica'}
        </Button>

        {create.isError ? (
          <Alert variant="destructive">
            <AlertDescription>{adminErrorMessage(create.error)}</AlertDescription>
          </Alert>
        ) : null}

        {exportQuery.data ? (
          <div className="grid gap-2 text-sm">
            {exportQuery.data.status === 'PENDING' || exportQuery.data.status === 'RUNNING' ? (
              <p className="text-muted-foreground">Gerando arquivo…</p>
            ) : null}
            {exportQuery.data.status === 'FAILED' ? (
              <Alert variant="destructive">
                <AlertDescription>
                  {exportQuery.data.error || 'Falha ao gerar o arquivo.'}
                </AlertDescription>
              </Alert>
            ) : null}
            {exportQuery.data.status === 'READY' && exportQuery.data.url ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  nativeButton={false}
                  render={<a href={exportQuery.data.url} target="_blank" rel="noreferrer" />}
                >
                  Baixar ZIP
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    void onCopy(exportQuery.data.url!);
                  }}
                >
                  {copied ? 'URL copiada' : 'Copiar URL'}
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
