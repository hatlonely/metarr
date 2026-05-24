'use client';

import { X } from 'lucide-react';
import { cn } from '@/src/renderer/lib/utils';

interface ErrorBannerProps {
  message: string;
  onDismiss: () => void;
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div
      className={cn(
        'mb-6 flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive',
      )}
    >
      <p className="flex-1">{message}</p>
      <button onClick={onDismiss} className="shrink-0 rounded p-0.5 hover:bg-destructive/20">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
