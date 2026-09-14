import { redirect } from 'next/navigation';
import {
  DEFAULT_SETTINGS_SECTION,
  isSettingsSection,
  settingsHref,
} from '@/packages/admin/helpers/SettingsTabs';

type ConfiguracoesIndexPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

/** Legacy `?tab=` and bare `/configuracoes` → path sections. */
export default async function ConfiguracoesIndexPage({
  searchParams,
}: ConfiguracoesIndexPageProps) {
  const params = await searchParams;
  const tab = firstParam(params.tab);
  if (isSettingsSection(tab)) {
    redirect(settingsHref(tab));
  }
  redirect(settingsHref(DEFAULT_SETTINGS_SECTION));
}
