'use client';

import { useLocale } from '@/hooks/use-locale';
import { t } from '@/lib/i18n';
import { Reveal, RevealItem } from '@/components/ui/reveal';

export function WorkflowSection() {
  const { locale } = useLocale();
  const tr = t(locale);

  return (
    <section className="border-y border-border/60 bg-muted/30">
      <div className="container mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <Reveal className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{tr.workflow.title}</h2>
          <p className="mt-3 text-muted-foreground">{tr.workflow.subtitle}</p>
        </Reveal>

        <Reveal stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tr.workflow.steps.map((step, i) => (
            <RevealItem
              key={step.title}
              className="relative rounded-2xl border bg-card p-6 shadow-sm"
            >
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-gradient text-sm font-semibold text-white shadow-sm">
                  {i + 1}
                </span>
                <h3 className="text-base font-semibold">{step.title}</h3>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
            </RevealItem>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
