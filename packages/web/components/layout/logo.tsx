import { Clapperboard } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-2 font-semibold tracking-tight', className)}>
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-gradient text-white shadow-sm">
        <Clapperboard className="h-4 w-4" />
      </span>
      <span>Metarr</span>
    </span>
  );
}
