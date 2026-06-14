'use client';

import { ErrorBanner } from '@/src/renderer/components/shared/error-banner';

interface ContentAreaProps {
  children: React.ReactNode;
  error: string | null;
  onDismissError: () => void;
}

/**
 * Main column next to the sidebar. Provides the brand glow and a fixed error
 * banner; scrolling is owned by each step's <StepShell>, so this stays a
 * full-height flex container.
 */
export function ContentArea({ children, error, onDismissError }: ContentAreaProps) {
  return (
    <div className="relative flex h-full min-w-0 flex-1 flex-col">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-40 bg-glow" />
      {error && (
        <div className="shrink-0 px-8 pt-4">
          <ErrorBanner message={error} onDismiss={onDismissError} />
        </div>
      )}
      <div className="relative min-h-0 flex-1">{children}</div>
    </div>
  );
}
