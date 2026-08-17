import type { ReactNode } from 'react';
import { Geist } from 'next/font/google';
import { cn } from '@/shared/helpers/utils';
import { AppProviders } from '@/shared/providers/AppProviders';
import './globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

export const metadata = {
  title: 'SaaS Odontológico',
  description: 'Prontuário, agenda e gestão para clínicas odontológicas',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={cn('font-sans', geist.variable)}>
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
