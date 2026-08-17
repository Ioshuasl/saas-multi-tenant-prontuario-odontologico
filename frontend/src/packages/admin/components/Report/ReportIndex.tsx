'use client';

import Link from 'next/link';
import { ReportExportPanel } from '@/packages/admin/components/Report/ReportExportPanel';
import { useAuth } from '@/shared/auth/AuthProvider';
import { hasPermission } from '@/shared/auth/permissions';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

const LINKS = [
  { href: '/app/relatorios/no-shows', label: 'Faltas', description: 'No-shows e cancelamentos', permission: 'reports.read' },
  { href: '/app/relatorios/procedures', label: 'Procedimentos', description: 'Mix de produção no período', permission: 'reports.read' },
  { href: '/app/relatorios/production', label: 'Produção', description: 'Executado por profissional', permission: 'reports.read' },
  { href: '/app/relatorios/revenue', label: 'Receita', description: 'Recebimentos no período', permission: 'reports.financial' },
  { href: '/app/relatorios/cash-flow', label: 'Fluxo de caixa', description: 'Entradas e saídas', permission: 'reports.financial' },
  { href: '/app/relatorios/overdue', label: 'Inadimplência', description: 'Títulos em atraso', permission: 'reports.financial' },
] as const;

export function ReportIndex() {
  const { me } = useAuth();
  const allowRevenue = hasPermission(me, 'reports.financial');

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-xl font-semibold">Relatórios</h1>
        <p className="text-sm text-muted-foreground">Indicadores da clínica e exportação CSV.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {LINKS.filter((item) => hasPermission(me, item.permission)).map((item) => (
          <Card key={item.href}>
            <CardHeader>
              <CardTitle>{item.label}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <p className="text-sm text-muted-foreground">{item.description}</p>
              <Button
                variant="outline"
                className="w-fit"
                nativeButton={false}
                render={<Link href={item.href} prefetch={false} />}
              >
                Abrir
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <ReportExportPanel allowRevenue={allowRevenue} />
    </div>
  );
}
