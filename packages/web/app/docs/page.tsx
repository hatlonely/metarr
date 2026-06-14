'use client';

import Link from 'next/link';
import { useLocale } from '@/hooks/use-locale';
import { t } from '@/lib/i18n';
import { docList } from '@/lib/docs-content';
import { Card, CardContent } from '@/components/ui/card';
import { Reveal } from '@/components/ui/reveal';
import { FileText, ArrowRight } from 'lucide-react';

export default function DocsPage() {
  const { locale } = useLocale();
  const tr = t(locale);

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-glow" />
      <section className="container relative mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <Reveal className="mb-12 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{tr.docs.title}</h1>
          <p className="mt-3 text-muted-foreground">{tr.docs.subtitle}</p>
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-2">
          {docList.map((doc, i) => (
            <Reveal key={doc.slug} delay={i * 0.04}>
              <Link href={`/docs/${doc.slug}`} className="group block">
                <Card className="transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md">
                  <CardContent className="flex items-center gap-3 p-5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <FileText className="h-5 w-5" />
                    </span>
                    <span className="flex-1 font-medium">{locale === 'zh' ? doc.zh : doc.en}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </CardContent>
                </Card>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
