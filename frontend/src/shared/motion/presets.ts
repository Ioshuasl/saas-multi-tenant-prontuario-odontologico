import type { Transition, Variants } from 'motion/react';

/** Só para dialogs (chunk lazy). Index/Form não importam motion. */
export const motionDurations = {
  micro: 0.15,
  enter: 0.28,
  exit: 0.18,
} as const;

export const easeOut: Transition['ease'] = [0.16, 1, 0.3, 1];
export const easeInOut: Transition['ease'] = [0.4, 0, 0.2, 1];

export const dialogContentVariants: Variants = {
  hidden: { opacity: 0, scale: 0.98, y: 8 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: motionDurations.enter, ease: easeOut },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: 4,
    transition: { duration: motionDurations.exit, ease: easeInOut },
  },
};
