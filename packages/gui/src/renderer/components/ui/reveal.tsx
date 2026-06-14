'use client';

import * as React from 'react';
import { motion, type Variants } from 'framer-motion';
import { cn } from '@/src/renderer/lib/utils';

const variants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

interface RevealProps {
  delay?: number;
  /** Stagger direct <RevealItem> children in sequence. */
  stagger?: boolean;
  className?: string;
  children?: React.ReactNode;
}

/** Lightweight fade-and-rise on mount. Used for step content and lists. */
export function Reveal({ delay = 0, stagger, className, children }: RevealProps) {
  return (
    <motion.div
      className={cn(className)}
      initial="hidden"
      animate="visible"
      variants={stagger ? { visible: { transition: { staggerChildren: 0.05 } } } : variants}
      transition={stagger ? undefined : { duration: 0.3, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

interface RevealItemProps {
  className?: string;
  children?: React.ReactNode;
}

export function RevealItem({ className, children }: RevealItemProps) {
  return (
    <motion.div
      className={cn(className)}
      variants={variants}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
