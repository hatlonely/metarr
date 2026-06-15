'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/src/renderer/components/ui/collapsible';
import { cn } from '@/src/renderer/lib/utils';

type Accent = 'neutral' | 'brand' | 'red' | 'orange' | 'blue' | 'green';

const accentText: Record<Accent, string> = {
  neutral: 'text-muted-foreground',
  brand: 'text-brand',
  red: 'text-destructive',
  orange: 'text-orange-600 dark:text-orange-400',
  blue: 'text-blue-600 dark:text-blue-400',
  green: 'text-green-600 dark:text-green-400',
};

const accentBadge: Record<Accent, string> = {
  neutral: 'bg-muted text-muted-foreground',
  brand: 'bg-brand/10 text-brand',
  red: 'bg-destructive/10 text-destructive',
  orange: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  green: 'bg-green-500/10 text-green-600 dark:text-green-400',
};

interface SectionProps {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  count?: number;
  accent?: Accent;
  collapsible?: boolean;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}

function Heading({
  title,
  icon: Icon,
  count,
  accent,
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  count?: number;
  accent: Accent;
}) {
  return (
    <div className="flex items-center gap-2">
      {Icon && <Icon className={cn('h-4 w-4 shrink-0', accentText[accent])} />}
      <span className="text-sm font-semibold">{title}</span>
      {count != null && (
        <span
          className={cn(
            'rounded-full px-1.5 py-0.5 text-[11px] font-medium tabular-nums',
            accentBadge[accent],
          )}
        >
          {count}
        </span>
      )}
    </div>
  );
}

/** Unified titled section block. Collapsible variant uses the accordion animation. */
export function Section({
  title,
  icon,
  count,
  accent = 'neutral',
  collapsible,
  defaultOpen = true,
  children,
  className,
}: SectionProps) {
  if (!collapsible) {
    return (
      <div className={cn('rounded-xl border bg-card shadow-sm', className)}>
        <div className="px-4 py-3">
          <Heading title={title} icon={icon} count={count} accent={accent} />
        </div>
        <div className="border-t px-4 py-3">{children}</div>
      </div>
    );
  }

  return (
    <Collapsible defaultOpen={defaultOpen} className={cn('rounded-xl border bg-card shadow-sm', className)}>
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition-colors hover:bg-muted/40 [&[data-state=open]>svg]:rotate-180">
        <Heading title={title} icon={icon} count={count} accent={accent} />
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
        <div className="border-t px-4 py-3">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}
