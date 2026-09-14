import { redirect } from 'next/navigation';
import { SETTINGS_SECTION, settingsHref } from '@/packages/admin/helpers/SettingsTabs';

export default function WhatsappRedirectPage() {
  redirect(settingsHref(SETTINGS_SECTION.WHATSAPP));
}
