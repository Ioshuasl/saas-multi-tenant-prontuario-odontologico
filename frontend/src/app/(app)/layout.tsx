import type { ReactNode } from 'react';
import Link from 'next/link';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateRows: 'auto 1fr' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1.25rem',
          borderBottom: '1px solid #e5e7eb',
          background: '#fff',
        }}
      >
        <strong>SaaS Odontológico</strong>
        <nav style={{ display: 'flex', gap: '1rem', fontSize: 14 }}>
          <Link href="/app">Início</Link>
          <Link href="/login">Sair</Link>
        </nav>
      </header>
      <div style={{ padding: '1.5rem' }}>{children}</div>
    </div>
  );
}
