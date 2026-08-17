'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ADMIN_NAV_ITEMS,
  isAdminNavActive,
  type AdminNavGroup,
} from '@/packages/admin/helpers/AdminNav';
import { useAuth } from '@/shared/auth/AuthProvider';
import { hasPermission } from '@/shared/auth/permissions';
import { Skeleton } from '@/shared/ui/skeleton';
import { SidebarRail } from '@/shared/ui/sidebar-chrome';
import type { ReactNode } from 'react';
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/shared/ui/sidebar-menu';
import { Sidebar } from '@/shared/ui/sidebar-panel';

const GROUPS: Array<{ id: AdminNavGroup; label: string }> = [
  { id: 'main', label: 'Principal' },
  { id: 'settings', label: 'Configurações' },
];

type AppSidebarProps = {
  clinicName?: string;
  inboxBadge?: ReactNode;
};

export function AppSidebar({ clinicName, inboxBadge }: AppSidebarProps) {
  const pathname = usePathname();
  const { me } = useAuth();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip={clinicName ?? 'Clínica'}
              render={<Link href="/app" prefetch={false} />}
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <span className="text-xs font-semibold">SO</span>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                {clinicName ? (
                  <>
                    <span className="truncate font-medium">{clinicName}</span>
                    <span className="truncate text-xs text-muted-foreground">Admin</span>
                  </>
                ) : (
                  <Skeleton className="h-8 w-28" />
                )}
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {GROUPS.map((group) => {
          const items = ADMIN_NAV_ITEMS.filter(
            (item) =>
              item.group === group.id &&
              (!item.permission || hasPermission(me, item.permission)),
          );
          return (
            <SidebarGroup key={group.id}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          tooltip={item.label}
                          isActive={isAdminNavActive(pathname, item.href)}
                          render={<Link href={item.href} prefetch={false} />}
                        >
                          <Icon />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                        {item.href === '/app/inbox' ? inboxBadge : null}
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
