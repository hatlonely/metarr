'use client';

import { useLocale } from '@/hooks/use-locale';
import { t } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Film, FolderSync } from 'lucide-react';

export function FeatureHighlight() {
  const { locale } = useLocale();
  const tr = t(locale);

  const features = [
    {
      icon: Search,
      title: tr.landing.feature1Title,
      desc: tr.landing.feature1Desc,
    },
    {
      icon: Film,
      title: tr.landing.feature2Title,
      desc: tr.landing.feature2Desc,
    },
    {
      icon: FolderSync,
      title: tr.landing.feature3Title,
      desc: tr.landing.feature3Desc,
    },
  ];

  return (
    <section className="container mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div className="grid gap-6 md:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title} className="transition-shadow hover:shadow-md">
            <CardHeader>
              <feature.icon className="mb-2 h-8 w-8 text-primary" />
              <CardTitle className="text-lg">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
