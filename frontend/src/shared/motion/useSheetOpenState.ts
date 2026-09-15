'use client';

import { useEffect, useState } from 'react';

/**
 * Controla o `open` do Sheet para animar abertura/fechamento do painel.
 * Monta fechado e abre no próximo frame (enter animation); `onClose` só
 * roda em `onOpenChangeComplete(false)` para não cortar o exit.
 */
export function useSheetOpenState(open: boolean, onClose: () => void) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!open) {
      setVisible(false);
      return;
    }
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, [open]);

  return {
    sheetOpen: visible,
    requestClose: () => setVisible(false),
    onOpenChange: (next: boolean) => {
      setVisible(next);
    },
    onOpenChangeComplete: (next: boolean) => {
      if (!next) onClose();
    },
  };
}
