'use client';

import { useEffect, useRef, useState } from 'react';
import { MoonIcon, SunIcon } from 'lucide-react';
import { cn } from '@/shared/helpers/utils';
import { useTheme } from '@/shared/providers/ThemeProvider';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setThemeWithTransition, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeTheme = theme === 'system' ? resolvedTheme : theme;
  const isDark = activeTheme === 'dark';

  const getToggleOrigin = () => {
    const el = toggleRef.current;
    if (!el) return undefined;
    const rect = el.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  };

  if (!mounted) {
    return (
      <div
        className={cn('h-8 w-[4.25rem] shrink-0 rounded-full border border-border bg-muted', className)}
        aria-hidden
      />
    );
  }

  return (
    <button
      ref={toggleRef}
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
      title="Alternar tema"
      onClick={() => setThemeWithTransition(isDark ? 'light' : 'dark', getToggleOrigin())}
      className={cn(
        'relative inline-flex h-8 w-[4.25rem] shrink-0 cursor-pointer items-center overflow-hidden rounded-full border outline-none select-none',
        'focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        isDark ? 'border-white/25 bg-zinc-950' : 'border-zinc-300 bg-zinc-50',
        className,
      )}
    >
      <SunIcon
        className={cn(
          'pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 transition-opacity duration-200',
          isDark
            ? 'opacity-0'
            : 'text-amber-500 opacity-100 drop-shadow-[0_0_4px_rgba(245,158,11,0.35)]',
        )}
        strokeWidth={2.25}
      />
      <MoonIcon
        className={cn(
          'pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 transition-opacity duration-200',
          isDark
            ? 'text-cyan-200 opacity-100 drop-shadow-[0_0_6px_rgba(34,211,238,0.45)]'
            : 'opacity-0',
        )}
        strokeWidth={2.25}
      />
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute top-1/2 left-0 size-7 -translate-y-1/2 rounded-full bg-white shadow-md transition-transform duration-200 ease-out',
          isDark ? 'translate-x-[2.15rem]' : 'translate-x-0.5 ring-1 ring-zinc-300',
        )}
      />
    </button>
  );
}
