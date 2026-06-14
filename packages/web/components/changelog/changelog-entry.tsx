'use client';

import type { ChangelogEntry } from '@/lib/changelog-data';
import { useLocale } from '@/hooks/use-locale';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ChangelogEntryProps {
  entry: ChangelogEntry;
  typeLabels: { feature: string; fix: string; change: string };
}

export function ChangelogEntryCard({ entry, typeLabels }: ChangelogEntryProps) {
  const { locale } = useLocale();

  return (
    <div className="relative border-l-2 border-border pl-6">
      <span className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full bg-brand-gradient ring-4 ring-background" />
      <div className="mb-3 flex items-center gap-3">
        <h3 className="text-xl font-semibold">v{entry.version}</h3>
        <span className="text-sm text-muted-foreground">{entry.date}</span>
      </div>
      <ul className="space-y-2.5">
        {entry.changes.map((change, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm">
            <Badge
              variant={change.type === 'feature' ? 'default' : 'secondary'}
              className={cn(
                'mt-0.5 shrink-0',
                change.type === 'feature' && 'bg-brand/10 text-brand',
                change.type === 'fix' && 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
              )}
            >
              {typeLabels[change.type]}
            </Badge>
            <span className="text-muted-foreground">{locale === 'zh' ? change.zh : change.en}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
