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
    <ScrollArea className="flex-1">
      <div className="mx-auto max-w-5xl px-8 py-6">
        {error && <ErrorBanner message={error} onDismiss={onDismissError} />}
        {children}
      </div>
    </ScrollArea>
  );
}
