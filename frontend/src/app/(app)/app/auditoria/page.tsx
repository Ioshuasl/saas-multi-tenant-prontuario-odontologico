import { redirect } from 'next/navigation';
import { SETTINGS_SECTION, settingsHref } from '@/packages/admin/helpers/SettingsTabs';

type AuditoriaRedirectPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function AuditoriaRedirectPage({ searchParams }: AuditoriaRedirectPageProps) {
  const params = await searchParams;
  redirect(
    settingsHref(SETTINGS_SECTION.AUDITORIA, {
      patientId: firstParam(params.patientId),
      actorId: firstParam(params.actorId),
      action: firstParam(params.action),
      from: firstParam(params.from),
      to: firstParam(params.to),
    }),
  );
}
