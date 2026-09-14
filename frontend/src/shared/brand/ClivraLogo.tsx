'use client';

import Image from 'next/image';
import { CLIVRA } from '@/shared/brand/ClivraBrand';
import { cn } from '@/shared/helpers/utils';

type ClivraLogoProps = {
  /** Só o ícone (sidebar colapsada / favicon visual). */
  markOnly?: boolean;
  /**
   * Usa PNG wordmark (mark + “Clivra”) em vez de ícone + texto CSS.
   * `light` = texto branco (painéis escuros); `dark` / `burgundy` = fundos claros.
   */
  wordmark?: false | 'dark' | 'light' | 'burgundy';
  /** Variante de texto no wordmark CSS (quando `wordmark` é false). */
  wordmarkClassName?: string;
  className?: string;
  size?: number;
};

function wordmarkSrc(variant: 'dark' | 'light' | 'burgundy') {
  if (variant === 'light') return CLIVRA.logoWordmarkLight;
  if (variant === 'burgundy') return CLIVRA.logoWordmarkBurgundy;
  return CLIVRA.logoWordmark;
}

export function ClivraLogo({
  markOnly = false,
  wordmark = false,
  wordmarkClassName,
  className,
  size = 32,
}: ClivraLogoProps) {
  if (wordmark) {
    const src = wordmarkSrc(wordmark);
    const height = size;
    const width = Math.round(size * (809 / 320));
    return (
      <span className={cn('inline-flex items-center', className)}>
        <Image
          src={src}
          alt={CLIVRA.name}
          width={width}
          height={height}
          className="h-auto w-auto"
          style={{ height, width: 'auto' }}
          priority
        />
      </span>
    );
  }

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <Image
        src={CLIVRA.logoIcon}
        alt=""
        width={size}
        height={size}
        className="shrink-0"
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
