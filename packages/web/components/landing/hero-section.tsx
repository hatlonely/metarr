'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useLocale } from '@/hooks/use-locale';
import { t } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { ArrowRight, Download, Sparkles } from 'lucide-react';

export function HeroSection() {
  const { locale } = useLocale();
  const tr = t(locale);

  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-glow" />
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.4] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />

      <div className="container relative mx-auto flex max-w-5xl flex-col items-center px-4 py-20 text-center sm:px-6 sm:py-28">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm"
        >
          <Sparkles className="h-3.5 w-3.5 text-brand" />
          {tr.hero.badge}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="mb-5 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
        >
          {tr.hero.title}{' '}
          <span className="text-gradient">{tr.hero.titleHighlight}</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-9 max-w-2xl text-base text-muted-foreground sm:text-lg"
        >
          {tr.hero.subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <Button size="lg" variant="brand" asChild>
            <Link href="/demo">
              {tr.hero.ctaPrimary}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/download">
              <Download className="h-4 w-4" />
              {tr.hero.ctaSecondary}
            </Link>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mt-16 w-full"
        >
          <HeroTerminal beforeLabel={tr.hero.terminalBefore} afterLabel={tr.hero.terminalAfter} />
          <p className="mt-4 text-xs text-muted-foreground">{tr.hero.terminalCaption}</p>
        </motion.div>
      </div>
    </section>
  );
}

function HeroTerminal({ beforeLabel, afterLabel }: { beforeLabel: string; afterLabel: string }) {
  return (
    <div className="mx-auto max-w-3xl overflow-hidden rounded-xl border bg-card text-left shadow-2xl shadow-brand/10">
      <div className="flex h-10 items-center gap-2 border-b bg-muted/40 px-4">
        <span className="h-3 w-3 rounded-full bg-red-400" />
        <span className="h-3 w-3 rounded-full bg-yellow-400" />
        <span className="h-3 w-3 rounded-full bg-green-400" />
      </div>
      <div className="grid gap-px bg-border/60 font-mono text-xs sm:grid-cols-2 sm:text-[13px]">
        <div className="bg-card p-5">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {beforeLabel}
          </div>
          <div className="space-y-1 text-muted-foreground">
            <div className="text-foreground/80">繁花.Blossoms.Shanghai.S01.2024/</div>
            <div className="pl-3 break-all">…S01E01.2160p.WEB-DL.H265.DDP5.1.mkv</div>
            <div className="pl-3 break-all">…S01E02.2160p.WEB-DL.H265.DDP5.1.mkv</div>
            <div className="pl-3 break-all text-muted-foreground/70">繁花.chs.srt</div>
          </div>
        </div>
        <div className="bg-card p-5">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-brand">
            {afterLabel}
          </div>
          <div className="space-y-1">
            <div className="text-foreground">繁花 (2024)/</div>
            <div className="pl-3 text-muted-foreground">Season 01/</div>
            <div className="pl-6 text-foreground/90">S01E01 - 序曲.mkv</div>
            <div className="pl-6 text-foreground/90">S01E01 - 序曲.zh.srt</div>
            <div className="pl-3 text-brand/80">poster.jpg · fanart.jpg · tvshow.nfo</div>
          </div>
        </div>
      </div>
    </div>
  );
}
