'use client';

import { ImageOff } from 'lucide-react';
import { cn } from '@/src/renderer/lib/utils';

/** Normalized search result, mapped from a TMDB match or a MusicBrainz release. */
export interface SearchCandidate {
  id: string | number;
  image?: string;
  title: string;
  year?: number;
  /** Secondary line, e.g. original title. */
  subtitle?: string;
  /** Small accent chip, e.g. the match reason. */
  badge?: string;
  /** Inline meta items, e.g. ["TMDB: 123", "IMDB: tt…"] or ["12 tracks"]. */
  meta?: string[];
  /** Longer description / overview. */
  description?: string;
}

interface ResultCardProps {
  candidate: SearchCandidate;
  selected: boolean;
  onClick: () => void;
}

export function ResultCard({ candidate, selected, onClick }: ResultCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full rounded-xl border p-3 text-left transition-all duration-200',
        selected
          ? 'border-brand bg-brand/5 shadow-sm'
          : 'border-border bg-card hover:border-brand/40 hover:shadow-sm',
      )}
    >
      <div className="flex gap-3">
        {candidate.image ? (
          <img
            src={candidate.image}
            alt=""
            className="h-28 w-20 shrink-0 rounded-lg object-cover ring-1 ring-black/5 dark:ring-white/10"
          />
        ) : (
          <div className="flex h-28 w-20 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <ImageOff className="h-6 w-6" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="font-medium leading-tight">
            {candidate.title}
            {candidate.year ? <span className="ml-1 text-muted-foreground">({candidate.year})</span> : null}
            {candidate.badge && (
              <span className="ml-2 inline-block rounded bg-brand/10 px-1.5 py-0.5 align-middle text-[10px] font-medium text-brand">
                {candidate.badge}
              </span>
            )}
          </div>
          {candidate.subtitle && (
            <div className="mt-0.5 truncate text-sm text-muted-foreground">{candidate.subtitle}</div>
          )}
          {candidate.meta && candidate.meta.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
              {candidate.meta.map((m, i) => (
                <span key={i}>{m}</span>
              ))}
            </div>
          )}
          {candidate.description && (
            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {candidate.description}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
