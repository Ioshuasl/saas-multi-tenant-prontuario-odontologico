import type { LucideIcon } from 'lucide-react';
import {
  ActivityIcon,
  ArmchairIcon,
  BanknoteIcon,
  BarChart3Icon,
  Building2Icon,
  CalendarDaysIcon,
  ChartNoAxesCombinedIcon,
  CircleDollarSignIcon,
  ClipboardListIcon,
  ClockIcon,
  ContactIcon,
  CreditCardIcon,
  FileTextIcon,
  HomeIcon,
  InboxIcon,
  ListChecksIcon,
  LockIcon,
  MessageCircleIcon,
  ScrollTextIcon,
  StethoscopeIcon,
  SyringeIcon,
  TriangleAlertIcon,
  UsersIcon,
  WalletIcon,
} from 'lucide-react';

export type AdminNavGroup = 'main' | 'settings';

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  group: AdminNavGroup;
  permission?: string;
};

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: '/app', label: 'Início', icon: HomeIcon, group: 'main' },
  { href: '/app/pacientes', label: 'Pacientes', icon: ContactIcon, group: 'main' },
  { href: '/app/agenda', label: 'Agenda', icon: CalendarDaysIcon, group: 'main' },
  {
    href: '/app/inbox',
    label: 'Inbox',
    icon: InboxIcon,
    group: 'main',
    permission: 'messaging.read',
  },
  {
    href: '/app/orcamentos',
    label: 'Orçamentos',
    icon: FileTextIcon,
    group: 'main',
    permission: 'quotes.read',
  },
  {
    href: '/app/financeiro/receber',
    label: 'Receber',
    icon: CircleDollarSignIcon,
    group: 'main',
    permission: 'finance.read',
  },
  {
    href: '/app/financeiro/caixa',
    label: 'Caixa',
    icon: WalletIcon,
    group: 'main',
    permission: 'finance.read',
  },
  {
    href: '/app/financeiro/pagar',
    label: 'Pagar',
    icon: BanknoteIcon,
    group: 'main',
    permission: 'finance.read',
  },
  {
    href: '/app/financeiro/fluxo',
    label: 'Fluxo',
    icon: ChartNoAxesCombinedIcon,
    group: 'main',
    permission: 'reports.financial',
  },
  {
    href: '/app/financeiro/inadimplencia',
    label: 'Inadimplência',
    icon: TriangleAlertIcon,
    group: 'main',
    permission: 'reports.financial',
  },
  {
    href: '/app/financeiro/producao',
    label: 'Produção',
    icon: ActivityIcon,
    group: 'main',
    permission: 'reports.read',
  },
  {
    href: '/app/relatorios',
    label: 'Relatórios',
    icon: BarChart3Icon,
    group: 'main',
    permission: 'reports.read',
  },
  { href: '/app/onboarding', label: 'Onboarding', icon: ListChecksIcon, group: 'main' },
  {
    href: '/app/configuracoes/clinica',
    label: 'Clínica',
    icon: Building2Icon,
    group: 'settings',
  },
  {
    href: '/app/configuracoes/horarios',
    label: 'Horários',
    icon: ClockIcon,
    group: 'settings',
  },
  {
    href: '/app/configuracoes/cadeiras',
    label: 'Cadeiras',
    icon: ArmchairIcon,
    group: 'settings',
  },
  {
    href: '/app/configuracoes/profissionais',
    label: 'Profissionais',
    icon: StethoscopeIcon,
    group: 'settings',
  },
  {
    href: '/app/configuracoes/procedimentos',
    label: 'Procedimentos',
    icon: SyringeIcon,
    group: 'settings',
  },
  {
    href: '/app/configuracoes/anamnese',
    label: 'Anamnese',
    icon: ClipboardListIcon,
    group: 'settings',
  },
  {
    href: '/app/configuracoes/membros',
    label: 'Membros',
    icon: UsersIcon,
    group: 'settings',
  },
  {
    href: '/app/whatsapp',
    label: 'WhatsApp',
    icon: MessageCircleIcon,
    group: 'settings',
  },
  {
    href: '/app/assinatura',
    label: 'Assinatura',
    icon: CreditCardIcon,
    group: 'settings',
    permission: 'subscription.manage',
  },
  {
    href: '/app/auditoria',
    label: 'Auditoria',
    icon: ScrollTextIcon,
    group: 'settings',
    permission: 'audit.read',
  },
  {
    href: '/app/privacidade',
    label: 'Privacidade',
    icon: LockIcon,
    group: 'settings',
    permission: 'data.export',
  },
];

export type AdminBreadcrumb = {
  href?: string;
  label: string;
};

/** Only includes routes that exist in ADMIN_NAV_ITEMS (no orphan segments). */
export function buildAdminBreadcrumbs(pathname: string): AdminBreadcrumb[] {
  const matches = ADMIN_NAV_ITEMS.filter((item) => {
    if (item.href === '/app') {
      return pathname === '/app' || pathname.startsWith('/app/');
    }
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }).sort((a, b) => a.href.length - b.href.length);

  if (matches.length === 0) {
    return [{ label: 'Início', href: '/app' }];
  }

  return matches.map((item, index) => {
    const isLast = index === matches.length - 1;
    return {
      label: item.label,
      href: isLast ? undefined : item.href,
    };
  });
}

export function isAdminNavActive(pathname: string, href: string): boolean {
  if (href === '/app') {
    return pathname === '/app';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
