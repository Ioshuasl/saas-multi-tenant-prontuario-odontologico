import type { LucideIcon } from 'lucide-react';
import {
  ArmchairIcon,
  Building2Icon,
  ClipboardListIcon,
  ClockIcon,
  CreditCardIcon,
  LockIcon,
  MessageCircleIcon,
  ScrollTextIcon,
  StethoscopeIcon,
  SyringeIcon,
  UsersIcon,
} from 'lucide-react';

export const SETTINGS_SECTION = {
  CLINICA: 'clinica',
  HORARIOS: 'horarios',
  CADEIRAS: 'cadeiras',
  PROFISSIONAIS: 'profissionais',
  PROCEDIMENTOS: 'procedimentos',
  ANAMNESE: 'anamnese',
  MEMBROS: 'membros',
  WHATSAPP: 'whatsapp',
  ASSINATURA: 'assinatura',
  AUDITORIA: 'auditoria',
  PRIVACIDADE: 'privacidade',
} as const;

/** @deprecated Use SETTINGS_SECTION */
export const SETTINGS_TAB = SETTINGS_SECTION;

export type SettingsSection = (typeof SETTINGS_SECTION)[keyof typeof SETTINGS_SECTION];
/** @deprecated Use SettingsSection */
export type SettingsTab = SettingsSection;

export type SettingsNavItem = {
  id: SettingsSection;
  label: string;
  icon: LucideIcon;
  permission?: string;
};

export const SETTINGS_NAV_ITEMS: readonly SettingsNavItem[] = [
  { id: SETTINGS_SECTION.CLINICA, label: 'Clínica', icon: Building2Icon },
  { id: SETTINGS_SECTION.HORARIOS, label: 'Horários', icon: ClockIcon },
  { id: SETTINGS_SECTION.CADEIRAS, label: 'Cadeiras', icon: ArmchairIcon },
  { id: SETTINGS_SECTION.PROFISSIONAIS, label: 'Profissionais', icon: StethoscopeIcon },
  { id: SETTINGS_SECTION.PROCEDIMENTOS, label: 'Procedimentos', icon: SyringeIcon },
  { id: SETTINGS_SECTION.ANAMNESE, label: 'Anamnese', icon: ClipboardListIcon },
  { id: SETTINGS_SECTION.MEMBROS, label: 'Membros', icon: UsersIcon },
  { id: SETTINGS_SECTION.WHATSAPP, label: 'WhatsApp', icon: MessageCircleIcon },
  {
    id: SETTINGS_SECTION.ASSINATURA,
    label: 'Assinatura',
    icon: CreditCardIcon,
    permission: 'subscription.manage',
  },
  {
    id: SETTINGS_SECTION.AUDITORIA,
    label: 'Auditoria',
    icon: ScrollTextIcon,
    permission: 'audit.read',
  },
  {
    id: SETTINGS_SECTION.PRIVACIDADE,
    label: 'Privacidade',
    icon: LockIcon,
    permission: 'data.export',
  },
] as const;

/** @deprecated Use SETTINGS_NAV_ITEMS */
export const SETTINGS_TABS = SETTINGS_NAV_ITEMS;

export const DEFAULT_SETTINGS_SECTION: SettingsSection = SETTINGS_SECTION.CLINICA;
/** @deprecated Use DEFAULT_SETTINGS_SECTION */
export const DEFAULT_SETTINGS_TAB = DEFAULT_SETTINGS_SECTION;

export const SETTINGS_PATH = '/app/configuracoes';

export function isSettingsSection(value: string | null | undefined): value is SettingsSection {
  return SETTINGS_NAV_ITEMS.some((item) => item.id === value);
}

/** @deprecated Use isSettingsSection */
export const isSettingsTab = isSettingsSection;

export function parseSettingsSection(value: string | null | undefined): SettingsSection {
  return isSettingsSection(value) ? value : DEFAULT_SETTINGS_SECTION;
}

/** @deprecated Use parseSettingsSection */
export const parseSettingsTab = parseSettingsSection;

export function settingsHref(
  section: SettingsSection = DEFAULT_SETTINGS_SECTION,
  extra?: Record<string, string | undefined | null>,
): string {
  const base = `${SETTINGS_PATH}/${section}`;
  if (!extra) return base;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(extra)) {
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

export function isSettingsPath(pathname: string): boolean {
  return pathname === SETTINGS_PATH || pathname.startsWith(`${SETTINGS_PATH}/`);
}
