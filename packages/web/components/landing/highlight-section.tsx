'use client';

import { useLocale } from '@/hooks/use-locale';
import { t } from '@/lib/i18n';
import { Reveal } from '@/components/ui/reveal';
import { Badge } from '@/components/ui/badge';
import { Captions, Images, Check, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export function HighlightSection() {
  const { locale } = useLocale();
  const tr = t(locale);
  const sub = tr.subtitleHighlight;
  const art = tr.artworkHighlight;

  return (
    <section className="container mx-auto max-w-6xl space-y-20 px-4 py-20 sm:px-6">
      {/* Subtitle */}
      <FeatureRow
        label={sub.label}
        icon={<Captions className="h-4 w-4" />}
        title={sub.title}
        desc={sub.desc}
        points={sub.points}
        visual={<SubtitleVisual languages={sub.languages} sourceLabel={tr.demo.source} />}
      />
      {/* Artwork (reversed) */}
      <FeatureRow
        reverse
        label={art.label}
        icon={<Images className="h-4 w-4" />}
        title={art.title}
        desc={art.desc}
        points={art.points}
        visual={<ArtworkVisual types={art.artworkTypes} nfoLabel={tr.demo.artworkNfo} />}
      />
    </section>
  );
}

function FeatureRow({
  reverse,
  label,
  icon,
  title,
  desc,
  points,
  visual,
}: {
  reverse?: boolean;
  label: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  points: string[];
  visual: React.ReactNode;
}) {
  return (
    <Reveal className="grid items-center gap-10 lg:grid-cols-2">
      <div className={cn(reverse && 'lg:order-2')}>
        <Badge
          variant="secondary"
          className="mb-4 gap-1.5 bg-brand/10 text-brand"
        >
          {icon}
          {label}
        </Badge>
        <h2 className="mb-4 text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
        <p className="mb-6 text-muted-foreground">{desc}</p>
        <ul className="space-y-3">
          {points.map((p) => (
            <li key={p} className="flex items-start gap-3 text-sm">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                <Check className="h-3 w-3" />
              </span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className={cn(reverse && 'lg:order-1')}>{visual}</div>
    </Reveal>
  );
}

function SubtitleVisual({ languages, sourceLabel }: { languages: string[]; sourceLabel: string }) {
  const rows = [
    { lang: '简体中文', src: 'SubDL', file: 'S01E01 - 序曲.zh.srt' },
    { lang: 'English', src: 'Assrt', file: 'S01E01 - 序曲.en.srt' },
    { lang: '日本語', src: 'SubDL', file: 'S01E01 - 序曲.ja.srt' },
  ];
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-lg shadow-brand/5">
      <div className="mb-4 flex flex-wrap gap-2">
        {languages.map((l) => (
          <span
            key={l}
            className="rounded-full border bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground"
          >
            {l}
          </span>
        ))}
      </div>
      <div className="space-y-2 font-mono text-xs">
        {rows.map((r) => (
          <div
            key={r.file}
            className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 px-3 py-2"
          >
            <span className="flex items-center gap-2">
              <Captions className="h-3.5 w-3.5 text-brand" />
              <span className="text-foreground/90">{r.file}</span>
            </span>
            <span className="shrink-0 rounded bg-brand/10 px-1.5 py-0.5 text-[10px] text-brand">
              {sourceLabel} · {r.src}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ArtworkVisual({ types, nfoLabel }: { types: string[]; nfoLabel: string }) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-lg shadow-brand/5">
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="aspect-[2/3] rounded-lg bg-brand-gradient opacity-90"
            style={{ opacity: 0.55 + i * 0.18 }}
          />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3">
        <div className="col-span-2 aspect-video rounded-lg bg-gradient-to-br from-brand/40 to-brand-2/30" />
        <div className="flex aspect-video flex-col items-center justify-center gap-1 rounded-lg border bg-muted/30 text-muted-foreground">
          <FileText className="h-5 w-5" />
          <span className="text-[10px]">{nfoLabel}</span>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {types.map((tp) => (
          <span
            key={tp}
            className="rounded-full border bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground"
          >
            {tp}
          </span>
        ))}
      </div>
    </div>
  );
}
