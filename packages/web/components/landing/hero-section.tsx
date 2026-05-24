'use client';

import Link from 'next/link';
import { useLocale } from '@/hooks/use-locale';
import { t } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Film } from 'lucide-react';

export function HeroSection() {
  const { locale } = useLocale();
  const tr = t(locale);

  return (
    <section className="container mx-auto flex max-w-5xl flex-col items-center px-4 py-16 text-center sm:px-6 sm:py-24 lg:py-32">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <Film className="h-8 w-8 text-primary" />
      </div>
      <h1 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
        {tr.landing.heroTitle}
      </h1>
      <p className="mb-8 max-w-2xl text-base text-muted-foreground sm:text-lg">
        {tr.landing.heroSubtitle}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/demo">
          <Button size="lg">{tr.landing.tryDemo}</Button>
        </Link>
        <Link href="/download">
          <Button variant="outline" size="lg">
            {tr.landing.download}
          </Button>
        </Link>
      </div>
      <div className="mt-16 w-full overflow-hidden rounded-xl border bg-card shadow-lg">
        <div className="flex h-10 items-center gap-2 border-b bg-muted/50 px-4">
          <div className="h-3 w-3 rounded-full bg-red-400" />
          <div className="h-3 w-3 rounded-full bg-yellow-400" />
          <div className="h-3 w-3 rounded-full bg-green-400" />
        </div>
        <div className="p-6">
          <div className="font-mono text-sm text-muted-foreground">
            <div className="mb-2 text-foreground/70">{'// Before'}</div>
            <div className="mb-1">{'繁花.Blossoms.Shanghai.S01.2024.2160p.WEB-DL.H265.DDP5.1-Group/'}</div>
            <div className="pl-4">
              {'繁花.Blossoms.Shanghai.S01E01.2024.2160p.WEB-DL.H265.DDP5.1-Group.mkv'}
            </div>
            <div className="my-4 border-t border-dashed" />
            <div className="mb-2 text-foreground/70">{'// After (Metarr)'}</div>
            <div className="mb-1">{'繁花 (2024)/'}</div>
            <div className="pl-4">{'Season 01/'}</div>
            <div className="pl-8">{'S01E01 - 繁花.mkv'}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
