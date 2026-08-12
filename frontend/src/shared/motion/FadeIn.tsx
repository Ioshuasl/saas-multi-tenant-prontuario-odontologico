'use client';

import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { fadeUpVariants } from '@/shared/motion/presets';
import { cn } from '@/shared/helpers/utils';

type FadeInProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

export function FadeIn({ children, className, delay = 0 }: FadeInProps) {
  return (
    <motion.div
      className={cn(className)}
      variants={fadeUpVariants}
      initial="hidden"
      animate="show"
      exit="exit"
      transition={delay ? { delay } : undefined}
    >
      {children}
    </motion.div>
  );
}
