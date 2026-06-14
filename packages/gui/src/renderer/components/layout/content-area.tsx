'use client';

import { ScrollArea } from '@/src/renderer/components/ui/scroll-area';
import { ErrorBanner } from '@/src/renderer/components/shared/error-banner';

interface ContentAreaProps {
  children: React.ReactNode;
  error: string | null;
  onDismissError: () => void;
}

export function ContentArea({ children, error, onDismissError }: ContentAreaProps) {
  return (
    <ScrollArea className="relative flex-1">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-glow" />
      <div className="relative mx-auto max-w-5xl px-8 py-6">
        {error && <ErrorBanner message={error} onDismiss={onDismissError} />}
        {children}
      </div>
    </ScrollArea>
  );
}
