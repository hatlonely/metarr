'use client';

import { cn } from '@/src/renderer/lib/utils';
import type { StepId } from '@/src/renderer/types/workflow';

interface SidebarStepProps {
  id: StepId;
  index: number;
  label: string;
  current: boolean;
  completed: boolean;
  isLast: boolean;
  onClick: () => void;
}

export function SidebarStep({
  id,
  index,
  label,
  current,
  completed,
  isLast,
  onClick,
}: SidebarStepProps) {
  return (
    <div className="relative">
      {/* Vertical connector line */}
      {!isLast && (
        <div
          className={cn(
            'absolute bottom-0 left-[21px] top-8 -translate-x-1/2',
            completed ? 'bg-brand/30' : 'bg-border',
          )}
          style={{ width: '2px' }}
        />
      )}

      <button
        onClick={onClick}
        className={cn(
          'relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-150',
          current
            ? 'bg-brand/10 font-medium text-brand'
            : completed
              ? 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              : 'text-sidebar-foreground/40 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
        )}
      >
        <span
          className={cn(
            'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-all duration-150',
            current
              ? 'bg-brand-gradient text-white shadow-sm shadow-brand/30'
              : completed
                ? 'bg-brand/15 text-brand'
                : 'bg-muted text-muted-foreground',
          )}
        >
          {completed ? '\u2713' : index + 1}
        </span>
        <span className="truncate">{label}</span>
      </button>
    </div>
  );
}
