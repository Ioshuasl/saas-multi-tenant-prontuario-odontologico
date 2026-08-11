'use client';

export default function LoginPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '2rem',
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: 420,
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: '2rem',
        }}
      >
        <p style={{ margin: 0, fontSize: 12, letterSpacing: '0.08em', color: '#6b7280' }}>
          SPRINT 0 · MOCK
        </p>
        <h1 style={{ margin: '0.5rem 0 0.25rem', fontSize: 28 }}>Entrar</h1>
        <p style={{ margin: '0 0 1.5rem', color: '#4b5563', lineHeight: 1.5 }}>
          Login mockado. Auth real entra na Sprint 1 (identidade).
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            window.location.href = '/app';
          }}
          style={{ display: 'grid', gap: '0.75rem' }}
        >
          <label style={{ display: 'grid', gap: 4, fontSize: 14 }}>
            E-mail
            <input
              name="email"
              type="email"
              defaultValue="dono@clinica.demo"
              required
              style={{
                padding: '0.65rem 0.75rem',
                borderRadius: 8,
                border: '1px solid #d1d5db',
              }}
            />
          </label>
          <label style={{ display: 'grid', gap: 4, fontSize: 14 }}>
            Senha
            <input
              name="password"
              type="password"
              defaultValue="demo"
              required
              style={{
                padding: '0.65rem 0.75rem',
                borderRadius: 8,
                border: '1px solid #d1d5db',
              }}
            />
          </label>
          <button
            type="submit"
            style={{
              marginTop: 8,
              padding: '0.75rem 1rem',
              borderRadius: 8,
              border: 0,
              background: '#111827',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Continuar
          </button>
        </form>
      </section>
    </main>
  );
}
