import { deriveSubtitles, type FakeRenamePlan } from '@/lib/demo-data';
import { Captions } from 'lucide-react';

interface DemoSubtitleProps {
  plan: FakeRenamePlan;
  labels: {
    subtitleFor: string;
    language: string;
    source: string;
    note: string;
  };
}

export function DemoSubtitle({ plan, labels }: DemoSubtitleProps) {
  const groups = deriveSubtitles(plan);

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">{labels.note}</p>
      <div className="space-y-3">
        {groups.map((group) => (
          <div key={group.videoFile} className="rounded-lg border">
            <div className="flex items-center gap-2 border-b bg-muted/30 px-4 py-2">
              <Captions className="h-4 w-4 text-brand" />
              <span className="truncate font-mono text-xs font-medium">{group.videoFile}</span>
            </div>
            <div className="divide-y">
              {group.items.map((item) => (
                <div
                  key={item.file}
                  className="flex items-center justify-between gap-3 px-4 py-2 font-mono text-xs"
                >
                  <span className="truncate text-foreground/90">{item.file}</span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      {item.language}
                    </span>
                    <span className="rounded bg-brand/10 px-1.5 py-0.5 text-[10px] text-brand">
                      {item.source}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
