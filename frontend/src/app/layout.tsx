import type { ReactNode } from 'react';

export const metadata = {
  title: 'SaaS Odontológico',
  description: 'Prontuário, agenda e gestão para clínicas odontológicas',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
          background: '#f6f7f9',
          color: '#111827',
        }}
      >
        {children}
      </body>
    </html>
  );
}
