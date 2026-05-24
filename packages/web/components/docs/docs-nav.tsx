'use client';

import Link from 'next/link';
import { useLocale } from '@/hooks/use-locale';
import { t } from '@/lib/i18n';
import { docList } from '@/lib/docs-content';
import { cn } from '@/lib/utils';

interface DocsNavProps {
  currentSlug?: string;
}

export function DocsNav({ currentSlug }: DocsNavProps) {
  const { locale } = useLocale();
  const tr = t(locale);

  return (
    <nav className="space-y-1">
      <p className="mb-3 text-sm font-semibold">{tr.docs.title}</p>
      {docList.map((doc) => (
        <Link
          key={doc.slug}
          href={`/docs/${doc.slug}`}
          className={cn(
            'block rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent',
            currentSlug === doc.slug && 'bg-accent font-medium text-accent-foreground',
            currentSlug !== doc.slug && 'text-muted-foreground',
          )}
        >
          {locale === 'zh' ? doc.zh : doc.en}
        </Link>
      ))}
    </nav>
  );
}
