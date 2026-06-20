'use client';

import { ScrollArea } from '@/src/renderer/components/ui/scroll-area';
import { cn } from '@/src/renderer/lib/utils';

interface PageShellProps {
  title: string;
  description?: string;
  /** Right-aligned header actions (search, buttons, etc.). */
  actions?: React.ReactNode;
  /** Fixed bottom action bar. */
  footer?: React.ReactNode;
  /** Constrain the body width; omit for full width. */
  width?: 'md' | 'lg' | 'xl' | 'full';
  children: React.ReactNode;
}

const widthMap = {
  md: 'max-w-2xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
  full: 'max-w-none',
} as const;

/**
 * Unified full-page chrome for top-level destinations (History, Settings):
 * fixed header (title + description + actions) + scrollable body + optional
 * bottom action bar. Same vertical rhythm as <StepShell>.
 */
export function PageShell({
  title,
  description,
  actions,
  footer,
  width = 'full',
  children,
}: PageShellProps) {
  const w = widthMap[width];
  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 px-8 pb-5 pt-7">
        <div className={cn('mx-auto flex items-start justify-between gap-4', w)}>
          <div className="min-w-0">
            <h2 className="text-xl font-bold tracking-tight">{title}</h2>
            {description && (
              <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
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
