'use client';

import { useLocale } from '@/hooks/use-locale';
import { t } from '@/lib/i18n';
import { Reveal, RevealItem } from '@/components/ui/reveal';
import { Info } from 'lucide-react';

export function PresetsSection() {
  const { locale } = useLocale();
  const tr = t(locale);

  return (
    <section className="border-y border-border/60 bg-muted/30">
      <div className="container mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <Reveal className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{tr.presets.title}</h2>
          <p className="mt-3 text-muted-foreground">{tr.presets.subtitle}</p>
        </Reveal>

        <Reveal stagger className="grid gap-4 md:grid-cols-2">
          {tr.presets.items.map((preset) => (
            <RevealItem key={preset.key} className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-brand-gradient" />
                <h3 className="text-sm font-semibold">{preset.name}</h3>
              </div>
              <div className="space-y-3 font-mono text-xs">
                <div>
                  <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                    {tr.presets.columns.tv}
                  </div>
                  <code className="block break-all rounded-md bg-muted/50 px-2.5 py-1.5 text-foreground/80">
                    {preset.tv}
                  </code>
                </div>
                <div>
                  <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                    {tr.presets.columns.movie}
                  </div>
                  <code className="block break-all rounded-md bg-muted/50 px-2.5 py-1.5 text-foreground/80">
                    {preset.movie}
                  </code>
                </div>
              </div>
            </RevealItem>
          ))}
        </Reveal>

        <Reveal className="mx-auto mt-8 flex max-w-2xl items-start justify-center gap-2 text-center text-xs text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{tr.presets.note}</span>
        </Reveal>
      </div>
    </section>
  );
}
