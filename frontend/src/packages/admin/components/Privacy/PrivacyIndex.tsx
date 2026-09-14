'use client';

import { DataSubjectRequestIndex } from '@/packages/admin/components/DataSubjectRequest/DataSubjectRequestIndex';
import { TenantExportPanel } from '@/packages/admin/components/TenantExport/TenantExportPanel';
import { useAuth } from '@/shared/auth/AuthProvider';
import { hasPermission } from '@/shared/auth/permissions';
import { ClivraPageHeader, ClivraSurface } from '@/shared/layout/ClivraPage';
import { Alert, AlertDescription } from '@/shared/ui/alert';

export function PrivacyIndex() {
  const { me } = useAuth();
  const allowed = hasPermission(me, 'data.export');

  if (!me) {
    return (
      <div className="grid min-w-0 gap-4">
        <ClivraPageHeader
          title="Privacidade"
          description="Exportação da clínica e solicitações do titular (LGPD)."
        />
        <ClivraSurface contentClassName="px-4 py-6">
          <p className="text-sm text-muted-foreground">Carregando privacidade…</p>
        </ClivraSurface>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="grid min-w-0 gap-4">
        <ClivraPageHeader
          title="Privacidade"
          description="Exportação da clínica e solicitações do titular (LGPD)."
        />
        <Alert variant="destructive">
          <AlertDescription>
            Você não tem permissão para gerenciar privacidade e exportação de dados.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="grid min-w-0 gap-4">
      <ClivraPageHeader
        title="Privacidade"
        description="Exportação da clínica e solicitações do titular (LGPD)."
      />
      <TenantExportPanel />
      <DataSubjectRequestIndex />
    </div>
  );
}
