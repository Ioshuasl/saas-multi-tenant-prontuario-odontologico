import type { LucideIcon } from 'lucide-react';
import {
  ArmchairIcon,
  Building2Icon,
  CalendarDaysIcon,
  ClockIcon,
  ContactIcon,
  HomeIcon,
  ListChecksIcon,
  StethoscopeIcon,
  SyringeIcon,
  UsersIcon,
} from 'lucide-react';

export type AdminNavGroup = 'main' | 'settings';

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  group: AdminNavGroup;
};

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: '/app', label: 'Início', icon: HomeIcon, group: 'main' },
  { href: '/app/pacientes', label: 'Pacientes', icon: ContactIcon, group: 'main' },
  { href: '/app/agenda', label: 'Agenda', icon: CalendarDaysIcon, group: 'main' },
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
    href: '/app/configuracoes/membros',
    label: 'Membros',
    icon: UsersIcon,
    group: 'settings',
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
