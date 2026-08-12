'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AppHeader } from '@/packages/admin/components/Layout/AppHeader';
import { AppSidebar } from '@/packages/admin/components/Layout/AppSidebar';
import { useClinicGetHook } from '@/packages/admin/hooks/Clinic/useClinicGetHook';
import { useAuth } from '@/shared/auth/AuthProvider';
import { PageTransition } from '@/shared/motion/PageTransition';
import { SidebarInset, SidebarProvider } from '@/shared/ui/sidebar';
import { Skeleton } from '@/shared/ui/skeleton';

type AppShellProps = {
  children: React.ReactNode;
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

  if (!ready) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <Skeleton className="h-8 w-40" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  const clinicName = clinicQuery.data?.name ?? 'Clínica';

  return (
    <SidebarProvider>
      <AppSidebar clinicName={clinicName} />
      <SidebarInset>
        <AppHeader />
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <PageTransition>{children}</PageTransition>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
