'use client';

import type { ReactNode } from 'react';
import { useAuth } from '@/shared/auth/AuthProvider';
import { hasPermission } from '@/shared/auth/permissions';

type CanProps = {
  permission: string;
  fallback?: ReactNode;
  children: ReactNode;
};

export function Can({ permission, fallback = null, children }: CanProps) {
  const { me } = useAuth();
  if (!hasPermission(me, permission)) return fallback;
  return children;
}
