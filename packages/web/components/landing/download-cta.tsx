'use client';

import Link from 'next/link';
import { useLocale } from '@/hooks/use-locale';
import { t } from '@/lib/i18n';
import { siteConfig } from '@/lib/site';
import { Reveal } from '@/components/ui/reveal';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { GitHubIcon } from '@/components/ui/icons';

export function DownloadCta() {
  const { locale } = useLocale();
  const tr = t(locale);

  return (
    <section className="container mx-auto max-w-5xl px-4 pb-24 pt-4 sm:px-6">
      <Reveal className="relative overflow-hidden rounded-3xl border bg-card p-10 text-center shadow-lg sm:p-16">
        <div className="pointer-events-none absolute inset-0 bg-glow opacity-70" />
        <div className="relative">
          <h2 className="mb-3 text-2xl font-bold tracking-tight sm:text-3xl">
            {tr.downloadCta.title}
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-muted-foreground">{tr.downloadCta.desc}</p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" variant="brand" asChild>
              <a href={siteConfig.releases} target="_blank" rel="noreferrer">
                <Download className="h-4 w-4" />
                {tr.downloadCta.primary}
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/download">{tr.downloadCta.secondary}</Link>
            </Button>
          </div>
          <a
            href={siteConfig.github}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <GitHubIcon className="h-4 w-4" /> {siteConfig.github.replace('https://', '')}
          </a>
        </div>
      </Reveal>
    </section>
  );
}
