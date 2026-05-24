'use client';

import Link from 'next/link';
import { useLocale } from '@/hooks/use-locale';
import { t } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';

export function DemoTeaser() {
  const { locale } = useLocale();
  const tr = t(locale);

  return (
    <section className="border-y bg-muted/30">
      <div className="container mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 py-16 text-center sm:px-6">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {tr.landing.demoTeaserTitle}
        </h2>
        <p className="max-w-lg text-muted-foreground">{tr.landing.demoTeaserDesc}</p>
        <Link href="/demo">
          <Button size="lg">
            <Play className="h-4 w-4" />
            {tr.landing.demoTeaserBtn}
          </Button>
        </Link>
      </div>
    </section>
  );
}
