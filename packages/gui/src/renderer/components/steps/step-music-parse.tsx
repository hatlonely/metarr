'use client';

import type { ParsedAlbum } from '@metarr/core';
import { StepShell } from '@/src/renderer/components/layout/step-shell';
import { StepFooter } from '@/src/renderer/components/layout/step-footer';
import { Button } from '@/src/renderer/components/ui/button';
import { t } from '@/src/renderer/lib/i18n';

interface StepMusicParseProps {
  locale: 'zh' | 'en';
  album: ParsedAlbum;
  loading: boolean;
  onBack: () => void;
  onNext: () => void;
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div className="min-w-0">
      <span className="text-muted-foreground">{label}: </span>
      <span className="font-medium">{value || '—'}</span>
    </div>
  );
}

export function StepMusicParse({ locale, album, loading, onBack, onNext }: StepMusicParseProps) {
  const text = t(locale);
  return (
    <StepShell
      title={text.steps.parse}
      description={text.musicStepDescAlbum}
      width="lg"
      footer={
        <StepFooter onBack={onBack} backLabel={text.back}>
          <Button onClick={onNext} disabled={loading}>
            {loading ? text.regenerating : text.musicNext}
          </Button>
        </StepFooter>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2 rounded-lg border bg-card p-4 text-sm">
          <Info label={text.musicArtist} value={album.albumArtist} />
          <Info label={text.musicAlbum} value={album.album} />
          <Info label={text.musicYear} value={album.year?.toString()} />
          <Info label={text.musicDiscs} value={String(album.discCount)} />
        </div>

        <div className="overflow-hidden rounded-lg border bg-card">
          <div className="flex items-center justify-between border-b px-4 py-2 text-xs font-medium text-muted-foreground">
            <span>{text.musicTracks} · {album.tracks.length}</span>
          </div>
          <ul className="divide-y">
            {album.tracks.map((tk, i) => (
              <li key={i} className="flex items-center gap-3 px-4 py-1.5 text-sm">
                <span className="w-12 shrink-0 text-right font-mono text-xs text-muted-foreground">
                  {album.discCount > 1 ? `${tk.disc}-` : ''}
                  {tk.track ?? '?'}
                </span>
                <span className="truncate">{tk.title ?? tk.originalFileName}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </StepShell>
  );
}
