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
  };

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-[#E8E2DC] bg-[#F7F4F0] px-3 sm:px-5 desk:px-7">
      <AppSidebarTrigger />

      <form onSubmit={onSearch} className="relative hidden min-w-0 flex-1 md:block">
        <SearchIcon
          className="pointer-events-none absolute top-1/2 left-3.5 size-3.5 -translate-y-1/2 text-[#9A908A]"
          strokeWidth={1.7}
        />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar paciente, nome, CPF ou telefone..."
          aria-label="Buscar paciente, nome, CPF ou telefone"
          className={cn(
            'h-9 w-full max-w-2xl rounded-full border border-[#E4DDD6] bg-white',
            'pr-4 pl-10 text-[13px] text-[#1A1A1A] placeholder:text-[#A39A94]',
            'outline-none transition-[border-color,box-shadow] focus:border-[#4A0F16]/35 focus:ring-2 focus:ring-[#4A0F16]/10',
          )}
        />
      </form>

      <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          className="relative inline-flex size-9 items-center justify-center rounded-full text-[#5C5652] transition-colors hover:bg-[#EFE9E3]"
          aria-label="Notificações"
        >
          <BellIcon className="size-4.5" strokeWidth={1.6} />
          <span className="absolute top-2 right-2 size-2 rounded-full bg-[#D64545] ring-2 ring-[#F7F4F0]" />
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex items-center gap-2 rounded-full py-0.5 pr-1 pl-0.5 transition-colors hover:bg-[#EFE9E3]"
            aria-label="Menu do usuário"
            aria-expanded={menuOpen}
          >
            <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#4A0F16] text-[11px] font-semibold text-white">
              {userInitials(user?.name, user?.email)}
            </span>
            <span className="hidden min-w-0 flex-col items-start text-left sm:flex">
              <span className="max-w-[11rem] truncate text-[13px] font-semibold leading-tight text-[#1A1A1A]">
                {fullName}
              </span>
              <span className="max-w-[11rem] truncate text-[11px] leading-tight text-[#8A7F79]">
                {roleLabel}
              </span>
            </span>
            <ChevronDownIcon className="hidden size-3.5 text-[#9A908A] sm:block" strokeWidth={1.8} />
          </button>

          {menuOpen ? (
            <>
              <button
                type="button"
                className="fixed inset-0 z-40 cursor-default"
                aria-label="Fechar menu"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute top-full right-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-[#E8E2DC] bg-white shadow-[0_12px_40px_rgb(0_0_0/0.12)]">
                <div className="border-b border-[#F0EAE5] px-4 py-3">
                  <p className="truncate text-sm font-semibold text-[#1A1A1A]">{fullName}</p>
                  <p className="truncate text-xs text-[#8A7F79]">{user?.email ?? ''}</p>
                </div>
                <div className="p-1.5">
                  <Link
                    href="/app/configuracoes/clinica"
                    prefetch={false}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-[#3A3330] transition-colors hover:bg-[#F3EEE9]"
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
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-[#B42318] transition-colors hover:bg-[#FDEBEC]"
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
