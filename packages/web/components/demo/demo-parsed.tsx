import type { ParsedEpisode } from '@/lib/parser-browser';
import { Badge } from '@/components/ui/badge';

interface ParsedDirResult {
  chineseTitle?: string;
  englishTitle?: string;
  year?: number;
  tags: Record<string, unknown>;
  isClean: boolean;
}

interface DemoParsedProps {
  parsedDir: ParsedDirResult;
  parsedFiles: ParsedEpisode[];
  labels: {
    dirName: string;
    titleLabel: string;
    year: string;
    tags: string;
    episodes: string;
    season: string;
    episode: string;
  };
}

export function DemoParsed({ parsedDir, parsedFiles, labels }: DemoParsedProps) {
  const tagEntries = Object.entries(parsedDir.tags).filter(([, v]) => v);

  return (
    <div className="space-y-4">
      {/* Info Grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">{labels.titleLabel}</p>
          <p className="font-medium">
            {parsedDir.chineseTitle || parsedDir.englishTitle || '-'}
          </p>
          {parsedDir.chineseTitle && parsedDir.englishTitle && (
            <p className="text-sm text-muted-foreground">{parsedDir.englishTitle}</p>
          )}
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">{labels.year}</p>
          <p className="font-medium">{parsedDir.year || '-'}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">{labels.tags}</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {tagEntries.length > 0 ? (
              tagEntries.map(([key, value]) => (
                <Badge key={key} variant="secondary" className="text-xs">
                  {String(value)}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">-</span>
            )}
          </div>
        </div>
      </div>

      {/* File list */}
      {parsedFiles.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium">{labels.episodes}</p>
          <div className="space-y-1">
            {parsedFiles.map((file, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-1.5 font-mono text-xs"
              >
                <Badge variant="outline" className="shrink-0 text-xs">
                  {file.season > 0 ? `${labels.season}${file.season}` : ''}
                  {file.episodes.length > 0 && file.season > 0 ? ' ' : ''}
                  {file.episodes.map((ep) => `${labels.episode}${ep}`).join(', ')}
                </Badge>
                <span className="truncate text-muted-foreground">{file.originalFileName}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
