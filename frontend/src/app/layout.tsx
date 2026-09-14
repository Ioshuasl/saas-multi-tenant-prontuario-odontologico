import type { ReactNode } from 'react';
import { Libre_Baskerville, Sora } from 'next/font/google';
import { CLIVRA } from '@/shared/brand/ClivraBrand';
import { cn } from '@/shared/helpers/utils';
import { AppProviders } from '@/shared/providers/AppProviders';
import './globals.css';

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const libreBaskerville = Libre_Baskerville({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-display',
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
    icon: CLIVRA.logoIcon,
    apple: CLIVRA.logoIcon,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={cn('font-sans', sora.variable, libreBaskerville.variable)}>
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
