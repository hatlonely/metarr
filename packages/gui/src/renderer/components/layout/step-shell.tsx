'use client';

import { ScrollArea } from '@/src/renderer/components/ui/scroll-area';
import { cn } from '@/src/renderer/lib/utils';

const widthMap = {
  sm: 'max-w-xl',
  md: 'max-w-2xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
} as const;

interface StepShellProps {
  title: string;
  description: string;
  /** Retained for call-site compatibility; the position is shown by the
   *  horizontal <StepProgress> at the top of the rename page. */
  step?: number;
  width?: keyof typeof widthMap;
  /** Fixed bottom action bar (use <StepFooter>). */
  footer?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Unified step container: fixed header + scrollable, width-constrained content
 * + fixed bottom action bar. Gives every step the same rhythm and a consistent
 * primary-action position.
 */
export function StepShell({ title, description, width = 'md', footer, children }: StepShellProps) {
  const w = widthMap[width];
  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 px-8 pb-5 pt-7">
        <div className={cn('mx-auto', w)}>
          <h2 className="text-xl font-bold tracking-tight">{title}</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
        </div>
      </header>

      <ScrollArea className="min-h-0 flex-1">
        <div className={cn('mx-auto px-8 pb-8', w)}>{children}</div>
      </ScrollArea>

      {footer && (
        <footer className="flex h-14 shrink-0 items-center border-t px-8">
          <div className={cn('mx-auto w-full', w)}>{footer}</div>
        </footer>
      )}
    </div>
  );
}
