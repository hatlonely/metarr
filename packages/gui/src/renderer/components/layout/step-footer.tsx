'use client';

import { ArrowLeft } from 'lucide-react';
import { Button } from '@/src/renderer/components/ui/button';

interface StepFooterProps {
  onBack?: () => void;
  backLabel?: string;
  /** Optional left-aligned hint (e.g. selection summary). */
  hint?: React.ReactNode;
  /** Right-aligned primary action(s). */
  children?: React.ReactNode;
}

/** Consistent bottom action bar: back on the left, primary action on the right. */
export function StepFooter({ onBack, backLabel, hint, children }: StepFooterProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        {onBack && (
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Button>
        )}
        {hint && <div className="min-w-0 truncate text-xs text-muted-foreground">{hint}</div>}
      </div>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </div>
  );
}
