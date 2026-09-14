'use client';

import {
  ThemeProvider as NextThemesProvider,
  useTheme as useNextTheme,
  type ThemeProviderProps,
} from 'next-themes';
import { createContext, useCallback, useContext, type ReactNode } from 'react';
import {
  startThemeTransition,
  type ThemeTransitionMode,
  type ThemeTransitionOrigin,
} from '@/shared/helpers/themeTransition';

type SetThemeArg = Parameters<ReturnType<typeof useNextTheme>['setTheme']>[0];

type ThemeContextValue = ReturnType<typeof useNextTheme> & {
  setThemeWithTransition: (theme: SetThemeArg, origin?: ThemeTransitionOrigin) => void;
};

const ThemeTransitionContext = createContext<ThemeContextValue | null>(null);

function resolveThemeMode(theme: SetThemeArg, currentTheme?: string): ThemeTransitionMode {
  const next = typeof theme === 'function' ? theme(currentTheme ?? 'light') : theme;
  if (next === 'dark') return 'dark';
  if (next === 'light') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function ThemeTransitionBridge({ children }: { children: ReactNode }) {
  const nextTheme = useNextTheme();

  const setThemeWithTransition = useCallback(
    (theme: SetThemeArg, origin?: ThemeTransitionOrigin) => {
      const mode = resolveThemeMode(theme, nextTheme.theme);
      const resolved =
        typeof theme === 'function' ? theme(nextTheme.theme ?? 'light') : theme;

      if (mode === (nextTheme.resolvedTheme as ThemeTransitionMode | undefined)) {
        nextTheme.setTheme(resolved);
        return;
      }

      startThemeTransition(
        mode,
        () => {
          nextTheme.setTheme(resolved);
        },
        origin,
      );
    },
    [nextTheme],
  );

  const value: ThemeContextValue = {
    ...nextTheme,
    setTheme: (theme) => setThemeWithTransition(theme),
    setThemeWithTransition,
  };

  return (
    <ThemeTransitionContext.Provider value={value}>{children}</ThemeTransitionContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeTransitionContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de ThemeProvider');
  }
  return context;
}

export function ThemeProvider({
  children,
  ...props
}: ThemeProviderProps & { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
      storageKey="odonto-theme"
      {...props}
    >
      <ThemeTransitionBridge>{children}</ThemeTransitionBridge>
    </NextThemesProvider>
  );
}
