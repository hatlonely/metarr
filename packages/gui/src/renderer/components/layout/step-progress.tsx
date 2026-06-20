'use client';

import { cn } from '@/src/renderer/lib/utils';
import type { StepId } from '@/src/renderer/types/workflow';

interface StepProgressProps {
  steps: StepId[];
  labels: string[];
  currentIndex: number;
  onStepClick: (index: number) => void;
}

/**
 * Horizontal step indicator for the rename wizard. Replaces the old vertical
 * sidebar stepper now that the sidebar is the app's top-level nav. Only steps
 * up to the current one are clickable.
 */
export function StepProgress({ steps, labels, currentIndex, onStepClick }: StepProgressProps) {
  return (
    <div className="flex items-center justify-center px-8 py-4">
      {steps.map((step, i) => {
        const completed = i < currentIndex;
        const current = i === currentIndex;
        const clickable = i <= currentIndex;
        return (
          <div key={step} className="flex items-center">
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onStepClick(i)}
              className={cn(
                'flex items-center gap-2 rounded-full px-2 py-1 transition-colors',
                clickable ? 'cursor-pointer' : 'cursor-default',
              )}
            >
              <span
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all duration-150',
                  current
                    ? 'bg-brand-gradient text-white shadow-sm shadow-brand/30'
                    : completed
                      ? 'bg-brand/15 text-brand'
                      : 'bg-muted text-muted-foreground',
                )}
              >
                {completed ? '✓' : i + 1}
              </span>
              <span
                className={cn(
                  'hidden text-sm transition-colors sm:inline',
                  current
                    ? 'font-medium text-foreground'
                    : completed
                      ? 'text-muted-foreground'
                      : 'text-muted-foreground/50',
                )}
              >
                {labels[i]}
              </span>
            </button>
            {i < steps.length - 1 && (
              <span className={cn('mx-1.5 h-px w-6 sm:w-8', completed ? 'bg-brand/30' : 'bg-border')} />
            )}
          </div>
        );
      })}
    </div>
  );
}
