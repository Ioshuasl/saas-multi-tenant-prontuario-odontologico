import type { ReactNode } from 'react';
import { Playfair_Display, Sora } from 'next/font/google';
import { CLIVRA } from '@/shared/brand/ClivraBrand';
import { cn } from '@/shared/helpers/utils';
import { AppProviders } from '@/shared/providers/AppProviders';
import './globals.css';

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
});

/** Títulos de marca / marketing (login e display) — referência visual Clivra. */
const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata = {
  title: {
    default: CLIVRA.name,
    template: `%s · ${CLIVRA.name}`,
  },
  description: CLIVRA.description,
  applicationName: CLIVRA.name,
  icons: {
    icon: [{ url: CLIVRA.favicon, type: 'image/x-icon' }, { url: '/favicon.png', type: 'image/png' }],
    apple: CLIVRA.appleIcon,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={cn('font-sans', sora.variable, playfair.variable)}>
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
