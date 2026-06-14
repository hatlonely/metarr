'use client';

import { Clapperboard } from 'lucide-react';
import { cn } from '@/src/renderer/lib/utils';

interface LogoProps {
  title: string;
  subtitle?: string;
}

export function Logo({ title, subtitle }: LogoProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-sm shadow-brand/30">
        <Clapperboard className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <h1 className={cn('text-base font-bold leading-tight tracking-tight text-sidebar-foreground')}>
          {title}
        </h1>
        {subtitle && (
          <p className="truncate text-[11px] leading-tight text-sidebar-foreground/50">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
