'use client';

import Link from 'next/link';
import { useLocale } from '@/hooks/use-locale';
import { t } from '@/lib/i18n';
import { Reveal } from '@/components/ui/reveal';
import { Button } from '@/components/ui/button';
import { ArrowRight, TerminalSquare } from 'lucide-react';

export function DemoTeaser() {
  const { locale } = useLocale();
  const tr = t(locale);

  return (
    <section className="container mx-auto max-w-5xl px-4 py-20 sm:px-6">
      <Reveal className="overflow-hidden rounded-3xl border bg-card p-8 text-center shadow-sm sm:p-12">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
          <TerminalSquare className="h-6 w-6" />
        </div>
        <h2 className="mb-3 text-2xl font-bold tracking-tight sm:text-3xl">{tr.demoTeaser.title}</h2>
        <p className="mx-auto mb-7 max-w-xl text-muted-foreground">{tr.demoTeaser.desc}</p>
        <Button size="lg" variant="brand" asChild>
          <Link href="/demo">
            {tr.demoTeaser.btn}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </Reveal>
    </section>
  );
}
