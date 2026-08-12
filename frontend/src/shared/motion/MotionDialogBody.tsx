'use client';

import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { dialogContentVariants } from '@/shared/motion/presets';

type MotionDialogBodyProps = {
  children: ReactNode;
  className?: string;
};

export function MotionDialogBody({ children, className }: MotionDialogBodyProps) {
  return (
    <motion.div
      className={className}
      variants={dialogContentVariants}
      initial="hidden"
      animate="show"
      exit="exit"
    >
      {children}
    </motion.div>
  );
}
