'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PanelLeftIcon, XIcon } from 'lucide-react';
import {
  ADMIN_NAV_ITEMS,
  isAdminNavActive,
  type AdminNavGroup,
} from '@/packages/admin/helpers/AdminNav';
import { useClivraShell } from '@/packages/admin/components/Layout/ClivraShellContext';
import { CLIVRA } from '@/shared/brand/ClivraBrand';
import { useAuth } from '@/shared/auth/AuthProvider';
import { hasPermission } from '@/shared/auth/permissions';
import { cn } from '@/shared/helpers/utils';
import { Button } from '@/shared/ui/button';

const GROUPS: Array<{ id: AdminNavGroup; label: string }> = [
  { id: 'main', label: 'Principal' },
  { id: 'settings', label: 'Configurações' },
];

const SIDEBAR_TAGLINE = 'Gestão completa para clínicas odontológicas.';

type AppSidebarProps = {
  clinicName?: string;
  inboxBadgeCount?: number;
};

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  badge,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: (typeof ADMIN_NAV_ITEMS)[number]['icon'];
  active: boolean;
  badge?: number;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      onClick={onNavigate}
      className={cn(
        'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
        active
          ? 'bg-white/[0.12] text-white'
          : 'text-white/70 hover:bg-white/[0.06] hover:text-white',
      )}
    >
      <Icon
        className={cn('size-[1.15rem] shrink-0 stroke-[1.5]', active ? 'text-white' : 'text-white/75')}
        aria-hidden
      />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {badge && badge > 0 ? (
        <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-white">
          {badge > 99 ? '99+' : badge}
        </span>
      ) : null}
    </Link>
  );
}

function SidebarBrand({ clinicName }: { clinicName?: string }) {
  return (
    <Link
      href="/app"
      prefetch={false}
      title={clinicName ? `${CLIVRA.name} · ${clinicName}` : CLIVRA.name}
      className="flex items-center gap-2.5 rounded-xl px-1 transition-opacity hover:opacity-90"
    >
      <Image
        src={CLIVRA.logoIcon}
        alt=""
        width={32}
        height={32}
        className="size-8 shrink-0 rounded-[22%] shadow-sm ring-1 ring-white/15"
        priority
      />
      <span className="truncate text-[1.15rem] font-semibold tracking-tight text-white">
        {CLIVRA.name}
      </span>
    </Link>
  );
}

function SidebarFooter() {
  return (
    <div className="border-t border-white/10 px-4 py-4">
      <div className="flex items-start gap-2.5">
        <Image
          src={CLIVRA.logoIcon}
          alt=""
          width={36}
          height={36}
          className="mt-0.5 size-9 shrink-0 rounded-[22%] opacity-90"
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-tight text-white">{CLIVRA.name}</p>
          <p className="mt-0.5 text-[11px] leading-snug text-white/55">{SIDEBAR_TAGLINE}</p>
        </div>
      </div>
    </div>
  );
}

function SidebarBody({
  clinicName,
  inboxBadgeCount,
  onNavigate,
  showClose,
}: {
  clinicName?: string;
  inboxBadgeCount: number;
  onNavigate?: () => void;
  showClose?: boolean;
}) {
  const pathname = usePathname();
  const { me } = useAuth();
  const { setMobileOpen } = useClivraShell();

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between gap-2 px-4 pb-2 pt-5">
        <SidebarBrand clinicName={clinicName} />
        {showClose ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-white/80 hover:bg-white/10 hover:text-white"
            aria-label="Fechar menu"
            onClick={() => setMobileOpen(false)}
          >
            <XIcon className="size-4" />
          </Button>
        ) : null}
      </div>

      <div className="mb-2" />

      <nav
        className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-2.5 pb-3"
        aria-label="Navegação principal"
      >
        {GROUPS.map((group, groupIndex) => {
          const items = ADMIN_NAV_ITEMS.filter(
            (item) =>
              item.group === group.id &&
              (!item.permission || hasPermission(me, item.permission)),
          );
          if (items.length === 0) return null;

          return (
            <div key={group.id} className={cn(groupIndex > 0 && 'mt-2')}>
              {groupIndex > 0 ? (
                <div className="mx-3 mb-2 border-t border-white/10" aria-hidden />
              ) : null}
              <ul className="flex flex-col gap-1">
                {items.map((item) => {
                  const showInboxBadge = item.href === '/app/inbox' && inboxBadgeCount > 0;
                  return (
                    <li key={item.href}>
                      <NavLink
                        href={item.href}
                        label={item.label}
                        icon={item.icon}
                        active={isAdminNavActive(pathname, item.href)}
                        badge={showInboxBadge ? inboxBadgeCount : undefined}
                        onNavigate={onNavigate}
                      />
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <SidebarFooter />
    </div>
  );
}

/** Sidebar Clivra — sempre expandida no desktop; drawer só no mobile. */
export function AppSidebar({ clinicName, inboxBadgeCount = 0 }: AppSidebarProps) {
  const { mobileOpen, isMobile, setMobileOpen } = useClivraShell();

  if (isMobile) {
    return (
      <>
        {mobileOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            aria-label="Fechar menu"
            onClick={() => setMobileOpen(false)}
          />
        ) : null}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-50 flex w-[16.5rem] flex-col bg-[#2D0B12] shadow-2xl transition-transform duration-200 md:hidden',
            mobileOpen ? 'translate-x-0' : '-translate-x-full',
          )}
          aria-hidden={!mobileOpen}
        >
          <SidebarBody
            clinicName={clinicName}
            inboxBadgeCount={inboxBadgeCount}
            showClose
            onNavigate={() => setMobileOpen(false)}
          />
        </aside>
      </>
    );
  }

  return (
    <aside className="sticky top-0 z-20 hidden h-svh w-[15.5rem] shrink-0 flex-col bg-[#2D0B12] md:flex">
      <SidebarBody clinicName={clinicName} inboxBadgeCount={inboxBadgeCount} />
    </aside>
  );
}

/** Só no mobile — abre o drawer. No desktop a sidebar fica sempre visível. */
export function AppSidebarTrigger({ className }: { className?: string }) {
  const { toggleMobile } = useClivraShell();
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className={cn('cursor-pointer text-foreground md:hidden', className)}
      aria-label="Abrir menu"
      onClick={toggleMobile}
    >
      <PanelLeftIcon className="size-4" />
    </Button>
  );
}
