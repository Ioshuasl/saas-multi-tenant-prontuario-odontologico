export type ThemeTransitionMode = 'light' | 'dark';

export type ThemeTransitionOrigin = {
  x: number;
  y: number;
};

let activeTransition: ViewTransition | null = null;

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function supportsViewTransitions(): boolean {
  return typeof document !== 'undefined' && 'startViewTransition' in document;
}

function setTransitionOrigin(origin?: ThemeTransitionOrigin) {
  const root = document.documentElement;
  const x = origin?.x ?? window.innerWidth / 2;
  const y = origin?.y ?? window.innerHeight / 2;
  const radius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  );

  root.style.setProperty('--theme-transition-x', `${x}px`);
  root.style.setProperty('--theme-transition-y', `${y}px`);
  root.style.setProperty('--theme-transition-radius', `${radius}px`);
}

function clearTransitionOrigin() {
  const root = document.documentElement;
  root.style.removeProperty('--theme-transition-x');
  root.style.removeProperty('--theme-transition-y');
  root.style.removeProperty('--theme-transition-radius');
}

/** Atualiza o DOM de forma síncrona — exigido pela View Transitions API. */
export function applyThemeToDocument(mode: ThemeTransitionMode): void {
  const root = document.documentElement;
  root.classList.toggle('dark', mode === 'dark');
  root.style.colorScheme = mode;
}

function finishTransition(transition: ViewTransition): void {
  void transition.finished
    .catch(() => undefined)
    .finally(() => {
      if (activeTransition === transition) {
        activeTransition = null;
      }
      clearTransitionOrigin();
    });
}

/**
 * Troca de tema com reveal circular (View Transitions API).
 * A classe `dark` é aplicada no `html` de forma síncrona para evitar timeout.
 */
export function startThemeTransition(
  mode: ThemeTransitionMode,
  syncState: () => void,
  origin?: ThemeTransitionOrigin,
): void {
  const apply = () => {
    applyThemeToDocument(mode);
    syncState();
  };

  if (prefersReducedMotion() || !supportsViewTransitions()) {
    apply();
    return;
  }

  if (activeTransition) {
    try {
      activeTransition.skipTransition();
    } catch {
      // Transição anterior já encerrada.
    }
    activeTransition = null;
    clearTransitionOrigin();
  }

  setTransitionOrigin(origin);

  try {
    const transition = document.startViewTransition(() => {
      apply();
    });
    activeTransition = transition;
    finishTransition(transition);
  } catch {
    activeTransition = null;
    clearTransitionOrigin();
    apply();
  }
}
