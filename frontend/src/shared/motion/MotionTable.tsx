'use client';

import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/shared/helpers/utils';
import { staggerContainerVariants, staggerItemVariants } from '@/shared/motion/presets';

type MotionTableBodyProps = {
  children: ReactNode;
};

export function MotionTableBody({ children }: MotionTableBodyProps) {
  return (
    <motion.tbody
      data-slot="table-body"
      className="[&_tr:last-child]:border-0"
      variants={staggerContainerVariants}
      initial="hidden"
      animate="show"
    >
      {children}
    </motion.tbody>
  );
}

type MotionTableRowProps = {
  children: ReactNode;
  className?: string;
};

export function MotionTableRow({ children, className }: MotionTableRowProps) {
  return (
    <motion.tr
      data-slot="table-row"
      className={cn(
        'border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted',
        className,
      )}
      variants={staggerItemVariants}
    >
      {children}
    </motion.tr>
  );
}
