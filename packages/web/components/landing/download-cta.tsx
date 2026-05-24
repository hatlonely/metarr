'use client';

import Link from 'next/link';
import { useLocale } from '@/hooks/use-locale';
import { t } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export function DownloadCta() {
  const { locale } = useLocale();
  const tr = t(locale);

  return (
    <section className="container mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div className="flex flex-col items-center gap-4 rounded-xl border bg-card p-8 text-center shadow-sm sm:p-12">
        <Download className="h-10 w-10 text-primary" />
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {tr.landing.downloadCtaTitle}
        </h2>
        <p className="max-w-lg text-muted-foreground">{tr.landing.downloadCtaDesc}</p>
        <Link href="/download">
          <Button size="lg">{tr.landing.download}</Button>
        </Link>
      </div>
    </section>
  );
}
