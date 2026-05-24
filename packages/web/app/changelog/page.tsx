'use client';

import { useLocale } from '@/hooks/use-locale';
import { t } from '@/lib/i18n';
import { changelogData } from '@/lib/changelog-data';
import { ChangelogEntryCard } from '@/components/changelog/changelog-entry';

export default function ChangelogPage() {
  const { locale } = useLocale();
  const tr = t(locale);

  const typeLabels = {
    feature: locale === 'zh' ? '新功能' : 'Feature',
    fix: locale === 'zh' ? '修复' : 'Fix',
    change: locale === 'zh' ? '变更' : 'Change',
  };

  return (
    <section className="container mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="mb-12 text-center">
        <h1 className="mb-2 text-3xl font-bold tracking-tight sm:text-4xl">{tr.changelog.title}</h1>
        <p className="text-muted-foreground">{tr.changelog.subtitle}</p>
      </div>

      <div className="space-y-10">
        {changelogData.map((entry) => (
          <ChangelogEntryCard key={entry.version} entry={entry} typeLabels={typeLabels} />
        ))}
      </div>
    </section>
  );
}
