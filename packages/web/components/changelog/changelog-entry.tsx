'use client';

import type { ChangelogEntry } from '@/lib/changelog-data';
import { useLocale } from '@/hooks/use-locale';
import { Badge } from '@/components/ui/badge';

interface ChangelogEntryProps {
  entry: ChangelogEntry;
  typeLabels: { feature: string; fix: string; change: string };
}

export function ChangelogEntryCard({ entry, typeLabels }: ChangelogEntryProps) {
  const { locale } = useLocale();

  return (
    <div className="border-l-2 border-primary pl-6">
      <div className="mb-3 flex items-center gap-3">
        <h3 className="text-xl font-semibold">v{entry.version}</h3>
        <span className="text-sm text-muted-foreground">{entry.date}</span>
      </div>
      <ul className="space-y-2">
        {entry.changes.map((change, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <Badge variant={change.type === 'feature' ? 'default' : change.type === 'fix' ? 'destructive' : 'secondary'} className="mt-0.5 shrink-0">
              {typeLabels[change.type]}
            </Badge>
            <span className="text-muted-foreground">
              {locale === 'zh' ? change.zh : change.en}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
