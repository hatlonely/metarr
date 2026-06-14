'use client';

import * as React from 'react';
import { motion, type Variants } from 'framer-motion';
import { cn } from '@/lib/utils';

const variants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

interface RevealProps {
  delay?: number;
  /** Render staggered children: each <RevealItem> fades in sequentially. */
  stagger?: boolean;
  as?: 'div' | 'section' | 'ul' | 'li' | 'span';
  className?: string;
  children?: React.ReactNode;
}

/**
 * Fade-and-rise on scroll into view. Respects reduced motion via framer-motion.
 * When `stagger` is set, direct children should be wrapped in <RevealItem>.
 */
export function Reveal({ delay = 0, stagger, className, children, as = 'div' }: RevealProps) {
  const MotionTag = motion[as];
  return (
    <MotionTag
      className={cn(className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      variants={stagger ? { visible: { transition: { staggerChildren: 0.08 } } } : variants}
      transition={stagger ? undefined : { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </MotionTag>
  );
}

interface RevealItemProps {
  as?: 'div' | 'li' | 'span';
  className?: string;
  children?: React.ReactNode;
}

export function RevealItem({ className, children, as = 'div' }: RevealItemProps) {
  const MotionTag = motion[as];
  return (
    <MotionTag
      className={cn(className)}
      variants={variants}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </MotionTag>
  );
}
