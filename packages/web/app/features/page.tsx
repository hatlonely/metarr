'use client';

import { useLocale } from '@/hooks/use-locale';
import { t } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Film, FolderSync, Check } from 'lucide-react';

export default function FeaturesPage() {
  const { locale } = useLocale();
  const tr = t(locale);

  const sections = [
    {
      icon: Search,
      data: tr.features.smartParse,
    },
    {
      icon: Film,
      data: tr.features.tmdbMatch,
    },
    {
      icon: FolderSync,
      data: tr.features.autoRename,
    },
  ];

  const items = (data: (typeof tr.features.smartParse | typeof tr.features.tmdbMatch | typeof tr.features.autoRename)) => {
    const result: string[] = [];
    let i = 1;
    while (`item${i}` in data) {
      result.push((data as Record<string, string>)[`item${i}`]);
      i++;
    }
    return result;
  };

  return (
    <section className="container mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="mb-12 text-center">
        <h1 className="mb-2 text-3xl font-bold tracking-tight sm:text-4xl">
          {tr.features.title}
        </h1>
        <p className="text-muted-foreground">{tr.features.subtitle}</p>
      </div>

      <div className="space-y-12">
        {sections.map((section) => (
          <Card key={section.data.title}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <section.icon className="h-8 w-8 text-primary" />
                <CardTitle className="text-xl">{section.data.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{section.data.desc}</p>
              <ul className="grid gap-2 sm:grid-cols-2">
                {items(section.data).map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
