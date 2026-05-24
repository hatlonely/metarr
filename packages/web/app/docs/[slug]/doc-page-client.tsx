'use client';

import { use } from 'react';
import { notFound } from 'next/navigation';
import { useLocale } from '@/hooks/use-locale';
import { getDocContent } from '@/lib/docs-content';
import { DocsNav } from '@/components/docs/docs-nav';
import { MarkdownContent } from '@/components/docs/markdown-content';

export function DocPageClient({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { locale } = useLocale();
  const doc = getDocContent(slug, locale);

  if (!doc) {
    notFound();
  }

  return (
    <section className="container mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="flex gap-8">
        <aside className="hidden w-48 shrink-0 md:block">
          <DocsNav currentSlug={slug} />
        </aside>
        <div className="min-w-0 flex-1">
          <h1 className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl">{doc.title}</h1>
          <MarkdownContent content={doc.content} />
        </div>
      </div>
    </section>
  );
}
