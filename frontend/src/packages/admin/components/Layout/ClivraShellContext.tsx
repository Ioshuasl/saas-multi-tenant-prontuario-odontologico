'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type ClivraShellContextValue = {
  mobileOpen: boolean;
  isMobile: boolean;
  setMobileOpen: (value: boolean) => void;
  toggleMobile: () => void;
};

const ClivraShellContext = createContext<ClivraShellContextValue | null>(null);

const MOBILE_MAX = 767;

export function useClivraShell() {
  const ctx = useContext(ClivraShellContext);
  if (!ctx) {
    throw new Error('useClivraShell must be used within ClivraShellProvider.');
  }
  return ctx;
}

export function ClivraShellProvider({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_MAX}px)`);
    const sync = () => {
      setIsMobile(mq.matches);
      if (!mq.matches) setMobileOpen(false);
    };
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const toggleMobile = useCallback(() => {
    setMobileOpen((open) => !open);
  }, []);

  const value = useMemo(
    () => ({ mobileOpen, isMobile, setMobileOpen, toggleMobile }),
    [mobileOpen, isMobile, toggleMobile],
  );

  return <ClivraShellContext.Provider value={value}>{children}</ClivraShellContext.Provider>;
}
