'use client';

import { OnboardingBanner } from '@/packages/admin/components/Onboarding/OnboardingBanner';
import { useAuth } from '@/shared/auth/AuthProvider';
import { FadeIn } from '@/shared/motion/FadeIn';

export function DashboardHome() {
  const { user, tenant } = useAuth();

  return (
    <FadeIn className="grid gap-6">
      <div className="grid gap-1">
        <h1 className="text-2xl font-semibold">
          Olá{user?.name ? `, ${user.name}` : ''}
        </h1>
        <p className="text-sm text-muted-foreground">
          Bem-vindo{tenant?.name ? ` à ${tenant.name}` : ' à clínica'}.
        </p>
      </div>
      <OnboardingBanner />
    </FadeIn>
  );
}
