'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { BellIcon, ChevronDownIcon, LogOutIcon, SearchIcon, SettingsIcon } from 'lucide-react';
import { AppSidebarTrigger } from '@/packages/admin/components/Layout/AppSidebar';
import { useAuth } from '@/shared/auth/AuthProvider';
import { cn } from '@/shared/helpers/utils';

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Cirurgião Dentista',
  DENTIST: 'Cirurgião Dentista',
  RECEPTION: 'Recepção',
  FINANCE: 'Financeiro',
  ASB: 'Auxiliar',
};

function userInitials(name: string | undefined, email: string | undefined): string {
  const source = name?.trim() || email?.trim() || 'U';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

function displayFullName(name: string | undefined, role: string | undefined): string {
  const trimmed = name?.trim() || 'Usuário';
  if (role === 'DENTIST' || role === 'OWNER') {
    if (/^dr\.?\s/i.test(trimmed)) return trimmed;
    return `Dr. ${trimmed}`;
  }
  return trimmed;
}

export function AppHeader() {
  const router = useRouter();
  const { user, me, logout } = useAuth();
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const role = me?.current.role;
  const roleLabel = ROLE_LABELS[role ?? ''] ?? role ?? 'Usuário';
  const fullName = displayFullName(user?.name, role);

  const onLogout = async () => {
    await logout();
    router.push('/login');
  };

  const onSearch = (event: FormEvent) => {
    event.preventDefault();
    const q = search.trim();
    router.push(q ? `/app/pacientes?search=${encodeURIComponent(q)}` : '/app/pacientes');
    setSearch('');
  };

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-3 sm:px-5 desk:px-6">
      <AppSidebarTrigger />

      <form onSubmit={onSearch} className="relative hidden min-w-0 flex-1 md:block">
        <button
          type="submit"
          className="absolute top-1/2 left-1.5 z-10 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Buscar"
        >
          <SearchIcon className="size-3.5" strokeWidth={1.7} />
        </button>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar paciente, nome, CPF ou telefone..."
          aria-label="Buscar paciente, nome, CPF ou telefone"
          className={cn(
            'h-9 w-full max-w-[560px] rounded-[10px] border border-input bg-background',
            'pr-4 pl-10 text-sm text-foreground placeholder:text-muted-foreground',
            'outline-none transition-[border-color,box-shadow] focus:border-ring focus:ring-2 focus:ring-ring/20',
          )}
        />
      </form>

      <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          className="relative inline-flex size-9 items-center justify-center rounded-[10px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Notificações"
        >
          <BellIcon className="size-4" strokeWidth={1.6} />
          <span className="absolute top-2 right-2 size-1.5 rounded-full bg-destructive ring-2 ring-card" />
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex items-center gap-2 rounded-[10px] py-0.5 pr-1 pl-0.5 transition-colors hover:bg-muted"
            aria-label="Menu do usuário"
            aria-expanded={menuOpen}
          >
            <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
              {userInitials(user?.name, user?.email)}
            </span>
            <span className="hidden min-w-0 flex-col items-start text-left sm:flex">
              <span className="max-w-[11rem] truncate text-sm font-semibold leading-tight text-foreground">
                {fullName}
              </span>
              <span className="max-w-[11rem] truncate text-xs leading-tight text-muted-foreground">
                {roleLabel}
              </span>
            </span>
            <ChevronDownIcon className="hidden size-3.5 text-muted-foreground sm:block" strokeWidth={1.8} />
          </button>

          {menuOpen ? (
            <>
              <button
                type="button"
                className="fixed inset-0 z-40 cursor-default"
                aria-label="Fechar menu"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute top-full right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-clivra-lg)]">
                <div className="border-b border-border px-4 py-3">
                  <p className="truncate text-sm font-semibold text-foreground">{fullName}</p>
                  <p className="truncate text-xs text-muted-foreground">{user?.email ?? ''}</p>
                </div>
                <div className="p-1.5">
                  <Link
                    href="/app/configuracoes/clinica"
                    prefetch={false}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-muted"
                  >
                    <SettingsIcon className="size-4" strokeWidth={1.7} />
                    Configurações
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      void onLogout();
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
                  >
                    <LogOutIcon className="size-4" strokeWidth={1.7} />
                    Sair
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
