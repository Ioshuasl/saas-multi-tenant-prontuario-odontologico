'use client';

import Link from 'next/link';
import { Fragment } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { BellIcon, LogOutIcon, SettingsIcon } from 'lucide-react';
import { buildAdminBreadcrumbs } from '@/packages/admin/helpers/AdminNav';
import { useAuth } from '@/shared/auth/AuthProvider';
import { Avatar, AvatarFallback } from '@/shared/ui/avatar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/shared/ui/breadcrumb';
import { Button } from '@/shared/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/shared/ui/empty';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/shared/ui/popover';
import { Separator } from '@/shared/ui/separator';
import { SidebarTrigger } from '@/shared/ui/sidebar';

function userInitials(name: string | undefined, email: string | undefined): string {
  const source = name?.trim() || email?.trim() || 'U';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const crumbs = buildAdminBreadcrumbs(pathname);

  const onLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="cursor-pointer" />
      <Separator orientation="vertical" className="mr-1 data-vertical:h-4" />

      <Breadcrumb className="min-w-0 flex-1">
        <BreadcrumbList>
          {crumbs.map((crumb, index) => {
            const isLast = index === crumbs.length - 1;
            return (
              <Fragment key={`${crumb.label}-${index}`}>
                {index > 0 ? <BreadcrumbSeparator /> : null}
                <BreadcrumbItem>
                  {isLast || !crumb.href ? (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      className="cursor-pointer"
                      render={<Link href={crumb.href} />}
                    >
                      {crumb.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-1">
        <Popover>
          <PopoverTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="cursor-pointer"
                aria-label="Notificações"
              />
            }
          >
            <BellIcon />
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80">
            <PopoverHeader>
              <PopoverTitle>Notificações</PopoverTitle>
              <PopoverDescription>Atualizações da clínica</PopoverDescription>
            </PopoverHeader>
            <Empty className="border-0 p-4">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <BellIcon />
                </EmptyMedia>
                <EmptyTitle>Nenhuma notificação</EmptyTitle>
                <EmptyDescription>
                  Avisos e alertas aparecerão aqui.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="cursor-pointer rounded-full"
                aria-label="Menu do usuário"
              />
            }
          >
            <Avatar size="sm">
              <AvatarFallback>{userInitials(user?.name, user?.email)}</AvatarFallback>
            </Avatar>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64">
            <PopoverHeader>
              <PopoverTitle>{user?.name ?? 'Usuário'}</PopoverTitle>
              <PopoverDescription>{user?.email ?? ''}</PopoverDescription>
            </PopoverHeader>
            <Separator />
            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                className="w-full cursor-pointer justify-start"
                render={<Link href="/app/configuracoes/clinica" />}
                nativeButton={false}
              >
                <SettingsIcon data-icon="inline-start" />
                Configurações
              </Button>
              <Button
                variant="ghost"
                className="w-full cursor-pointer justify-start text-destructive hover:bg-transparent hover:text-destructive"
                onClick={() => {
                  void onLogout();
                }}
              >
                <LogOutIcon data-icon="inline-start" />
                Sair
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}
