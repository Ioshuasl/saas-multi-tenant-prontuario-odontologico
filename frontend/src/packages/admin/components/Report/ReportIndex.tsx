'use client';

import Link from 'next/link';
import { ReportExportPanel } from '@/packages/admin/components/Report/ReportExportPanel';
import { useAuth } from '@/shared/auth/AuthProvider';
import { hasPermission } from '@/shared/auth/permissions';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';

const REPORT_LINKS = [
  {
    href: '/app/relatorios/faltas',
    title: 'Faltas',
    description: 'No-shows e cancelamentos no período',
    permission: 'reports.financial' as const,
  },
  {
    href: '/app/relatorios/receita',
    title: 'Receita',
    description: 'Pagamentos recebidos agrupados',
    permission: 'reports.financial' as const,
  },
  {
    href: '/app/relatorios/producao',
    title: 'Procedimentos',
    description: 'Produção por procedimento no período',
    permission: 'reports.read' as const,
  },
  {
    href: '/app/financeiro/fluxo',
    title: 'Fluxo de caixa',
    description: 'Entradas e saídas (financeiro)',
    permission: 'reports.financial' as const,
  },
  {
    href: '/app/financeiro/inadimplencia',
    title: 'Inadimplência',
    description: 'Parcelas vencidas por faixa',
    permission: 'reports.financial' as const,
  },
  {
    href: '/app/financeiro/producao',
    title: 'Produção por profissional',
    description: 'Executado × recebido (financeiro)',
    permission: 'reports.read' as const,
  },
];

export function ReportIndex() {
  const { me } = useAuth();
  const canRead = hasPermission(me, 'reports.read');

  if (!canRead) {
    return (
      <div className="grid gap-4">
        <h1 className="text-xl font-semibold">Relatórios</h1>
        <Alert variant="destructive">
          <AlertDescription>Você não tem permissão para ver relatórios.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const links = REPORT_LINKS.filter((item) => hasPermission(me, item.permission));

  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <h1 className="text-xl font-semibold">Relatórios</h1>
        <p className="text-sm text-muted-foreground">
          Indicadores da clínica e exportação em CSV.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((item) => (
          <Link key={item.href} href={item.href} className="block">
            <Card className="h-full transition-colors hover:bg-muted/40">
              <CardHeader>
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      <ReportExportPanel />
    </div>
  );
}
