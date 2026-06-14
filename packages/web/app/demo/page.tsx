'use client';

import { useLocale } from '@/hooks/use-locale';
import { t } from '@/lib/i18n';
import { DemoWorkflow } from '@/components/demo/demo-workflow';

export default function DemoPage() {
  const { locale } = useLocale();
  const tr = t(locale);

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-glow" />
      <section className="container relative mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold tracking-tight sm:text-4xl">{tr.demo.title}</h1>
          <p className="mx-auto max-w-xl text-sm text-muted-foreground">{tr.demo.subtitle}</p>
        </div>
        <DemoWorkflow />
      </section>
    </div>
  );
}
