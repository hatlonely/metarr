'use client';

import Link from 'next/link';
import { useLocale } from '@/hooks/use-locale';
import { t } from '@/lib/i18n';
import { docList } from '@/lib/docs-content';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export default function DocsPage() {
  const { locale } = useLocale();
  const tr = t(locale);

  return (
    <section className="container mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="mb-12 text-center">
        <h1 className="mb-2 text-3xl font-bold tracking-tight sm:text-4xl">{tr.docs.title}</h1>
        <p className="text-muted-foreground">{tr.docs.subtitle}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {docList.map((doc) => (
          <Link key={doc.slug} href={`/docs/${doc.slug}`}>
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">
                    {locale === 'zh' ? doc.zh : doc.en}
                  </CardTitle>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
