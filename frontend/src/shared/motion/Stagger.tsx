'use client';

import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import {
  staggerContainerVariants,
  staggerItemVariants,
} from '@/shared/motion/presets';
import { cn } from '@/shared/helpers/utils';

type StaggerListProps = {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'ul';
};

export function StaggerList({ children, className, as = 'div' }: StaggerListProps) {
  if (as === 'ul') {
    return (
      <motion.ul
        className={cn(className)}
        variants={staggerContainerVariants}
        initial="hidden"
        animate="show"
      >
        {children}
      </motion.ul>
    );
  }

  return (
    <motion.div
      className={cn(className)}
      variants={staggerContainerVariants}
      initial="hidden"
      animate="show"
    >
      {children}
    </motion.div>
  );
}

type StaggerItemProps = {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'li';
};

export function StaggerItem({ children, className, as = 'div' }: StaggerItemProps) {
  if (as === 'li') {
    return (
      <motion.li className={cn(className)} variants={staggerItemVariants}>
        {children}
      </motion.li>
    );
  }

  return (
    <motion.div className={cn(className)} variants={staggerItemVariants}>
      {children}
    </motion.div>
  );
}
