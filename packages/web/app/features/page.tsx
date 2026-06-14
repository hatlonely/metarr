'use client';

import { useLocale } from '@/hooks/use-locale';
import { t } from '@/lib/i18n';
import { capabilityIcons } from '@/lib/capability-icons';
import { Reveal } from '@/components/ui/reveal';
import { Check } from 'lucide-react';

export default function FeaturesPage() {
  const { locale } = useLocale();
  const tr = t(locale);

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-glow" />
      <section className="container relative mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <Reveal className="mb-14 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{tr.features.title}</h1>
          <p className="mt-3 text-muted-foreground">{tr.features.subtitle}</p>
        </Reveal>

        <div className="space-y-6">
          {tr.features.sections.map((section, i) => {
            const Icon = capabilityIcons[section.key];
            return (
              <Reveal key={section.key} delay={i * 0.04}>
                <article className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
                  <div className="mb-5 flex items-center gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-sm">
                      {Icon ? <Icon className="h-6 w-6" /> : null}
                    </span>
                    <div>
                      <h2 className="text-xl font-semibold">{section.title}</h2>
                    </div>
                  </div>
                  <p className="mb-6 text-muted-foreground">{section.desc}</p>
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {section.points.map((point) => (
                      <li key={point} className="flex items-start gap-2.5 text-sm">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                          <Check className="h-3 w-3" />
                        </span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              </Reveal>
            );
          })}
        </div>
      </section>
    </div>
  );
}
