import { deriveArtwork, type FakeRenamePlan } from '@/lib/demo-data';
import { Image as ImageIcon, FileText } from 'lucide-react';

interface DemoArtworkProps {
  plan: FakeRenamePlan;
  type: 'tv' | 'movie';
  labels: {
    images: string;
    nfo: string;
    note: string;
  };
}

export function DemoArtwork({ plan, type, labels }: DemoArtworkProps) {
  const { images, nfos } = deriveArtwork(plan, type);

  return (
    <div className="space-y-5">
      <p className="text-xs text-muted-foreground">{labels.note}</p>

      <div>
        <p className="mb-2 flex items-center gap-2 text-sm font-medium">
          <ImageIcon className="h-4 w-4 text-brand" />
          {labels.images}
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {images.map((img) => (
            <div
              key={img.file}
              className="flex items-center justify-between gap-3 rounded-lg border bg-muted/20 px-3 py-2"
            >
              <span className="truncate font-mono text-xs text-foreground/90">{img.file}</span>
              <span className="shrink-0 rounded bg-brand/10 px-1.5 py-0.5 text-[10px] text-brand">
                {img.type}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 flex items-center gap-2 text-sm font-medium">
          <FileText className="h-4 w-4 text-brand" />
          {labels.nfo}
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {nfos.map((nfo) => (
            <div
              key={nfo.file}
              className="flex items-center justify-between gap-3 rounded-lg border bg-muted/20 px-3 py-2"
            >
              <span className="truncate font-mono text-xs text-foreground/90">{nfo.file}</span>
              <span className="shrink-0 rounded bg-brand/10 px-1.5 py-0.5 text-[10px] text-brand">
                {nfo.type}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
