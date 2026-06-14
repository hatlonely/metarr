'use client';

import { useLocale } from '@/hooks/use-locale';
import { t } from '@/lib/i18n';
import { changelogData } from '@/lib/changelog-data';
import { ChangelogEntryCard } from '@/components/changelog/changelog-entry';

export default function ChangelogPage() {
  const { locale } = useLocale();
  const tr = t(locale);

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-glow" />
      <section className="container relative mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="mb-12 text-center">
          <h1 className="mb-2 text-3xl font-bold tracking-tight sm:text-4xl">{tr.changelog.title}</h1>
          <p className="text-muted-foreground">{tr.changelog.subtitle}</p>
        </div>

        <div className="space-y-10">
          {changelogData.map((entry) => (
            <ChangelogEntryCard key={entry.version} entry={entry} typeLabels={tr.changelog.types} />
          ))}
        </div>
      </section>
    </div>
  );
}
