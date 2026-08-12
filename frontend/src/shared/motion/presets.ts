import type { Transition, Variants } from 'motion/react';

/** ui-ux-pro-max: 150–300ms, exit faster than enter, transform/opacity only */
export const motionDurations = {
  micro: 0.15,
  enter: 0.28,
  exit: 0.18,
  stagger: 0.05,
} as const;

export const easeOut: Transition['ease'] = [0.16, 1, 0.3, 1];
export const easeInOut: Transition['ease'] = [0.4, 0, 0.2, 1];

export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: motionDurations.enter, ease: easeOut },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: { duration: motionDurations.exit, ease: easeInOut },
  },
};

export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: motionDurations.enter, ease: easeOut },
  },
  exit: {
    opacity: 0,
    transition: { duration: motionDurations.exit, ease: easeInOut },
  },
};

export const staggerContainerVariants: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: motionDurations.stagger,
      delayChildren: 0.04,
    },
  },
};

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: easeOut },
  },
};

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
