'use client';

import Image from 'next/image';
import { CLIVRA } from '@/shared/brand/ClivraBrand';
import { cn } from '@/shared/helpers/utils';

type ClivraLogoProps = {
  /** Só o ícone (sidebar colapsada / favicon visual). */
  markOnly?: boolean;
  /** Variante de texto no wordmark. */
  wordmarkClassName?: string;
  className?: string;
  size?: number;
};

export function ClivraLogo({
  markOnly = false,
  wordmarkClassName,
  className,
  size = 32,
}: ClivraLogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <Image
        src={CLIVRA.logoIcon}
        alt=""
        width={size}
        height={size}
        className="rounded-[22%] shadow-sm"
        priority
      />
      {markOnly ? (
        <span className="sr-only">{CLIVRA.name}</span>
      ) : (
        <span
          className={cn(
            'text-base font-semibold tracking-tight text-foreground',
            wordmarkClassName,
          )}
        >
          {CLIVRA.name}
        </span>
      )}
    </span>
  );
}
