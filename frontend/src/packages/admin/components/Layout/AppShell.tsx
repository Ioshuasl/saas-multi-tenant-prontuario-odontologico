'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { AppHeader } from '@/packages/admin/components/Layout/AppHeader';
import { AppSidebar } from '@/packages/admin/components/Layout/AppSidebar';
import { useClinicGetHook } from '@/packages/admin/hooks/Clinic/useClinicGetHook';
import { useAuth } from '@/shared/auth/AuthProvider';
import { Skeleton } from '@/shared/ui/skeleton';
import { SidebarInset } from '@/shared/ui/sidebar-chrome';
import { SidebarProvider } from '@/shared/ui/sidebar-context';
import { TooltipProvider } from '@/shared/ui/tooltip';

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const { ready, isAuthenticated } = useAuth();
  const router = useRouter();
  const clinicQuery = useClinicGetHook({ enabled: ready && isAuthenticated });

  useEffect(() => {
    if (ready && !isAuthenticated) {
      router.replace('/login');
    }
  }, [ready, isAuthenticated, router]);

  if (!ready || !isAuthenticated) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <Skeleton className="h-8 w-40" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar clinicName={clinicQuery.data?.name} />
        <SidebarInset>
          <AppHeader />
          <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
