'use client';

import { useLocale } from '@/hooks/use-locale';
import { t } from '@/lib/i18n';
import { capabilityIcons } from '@/lib/capability-icons';
import { Reveal, RevealItem } from '@/components/ui/reveal';

export function CapabilitiesSection() {
  const { locale } = useLocale();
  const tr = t(locale);

  return (
    <section className="container mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <Reveal className="mx-auto mb-14 max-w-2xl text-center">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{tr.capabilities.title}</h2>
        <p className="mt-3 text-muted-foreground">{tr.capabilities.subtitle}</p>
      </Reveal>

      <Reveal stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {tr.capabilities.items.map((item) => {
          const Icon = capabilityIcons[item.key];
          return (
            <RevealItem
              key={item.key}
              className="group relative rounded-2xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-brand/40 hover:shadow-lg hover:shadow-brand/5"
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand transition-colors group-hover:bg-brand-gradient group-hover:text-white">
                {Icon ? <Icon className="h-5 w-5" /> : null}
              </div>
              <h3 className="mb-2 text-base font-semibold">{item.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
            </RevealItem>
          );
        })}
      </Reveal>
    </section>
  );
}
