'use client';

import { DataSubjectRequestIndex } from '@/packages/admin/components/DataSubjectRequest/DataSubjectRequestIndex';
import { TenantExportPanel } from '@/packages/admin/components/TenantExport/TenantExportPanel';
import { useAuth } from '@/shared/auth/AuthProvider';
import { hasPermission } from '@/shared/auth/permissions';
import { Alert, AlertDescription } from '@/shared/ui/alert';

export function PrivacyIndex() {
  const { me } = useAuth();
  const allowed = hasPermission(me, 'data.export');

  if (!me) {
    return <p className="text-sm text-muted-foreground">Carregando privacidade…</p>;
  }

  if (!allowed) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Você não tem permissão para gerenciar privacidade e exportação de dados.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-xl font-semibold">Privacidade</h1>
        <p className="text-sm text-muted-foreground">
          Exportação da clínica e solicitações do titular (LGPD).
        </p>
      </div>
      <TenantExportPanel />
      <DataSubjectRequestIndex />
    </div>
  );
}
