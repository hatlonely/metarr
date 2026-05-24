'use client';

import { cn } from '@/src/renderer/lib/utils';
import type { TMDBMatch } from '@metarr/core';

interface PosterCardProps {
  match: TMDBMatch;
  selected: boolean;
  onClick: () => void;
  locale: 'zh' | 'en';
}

export function PosterCard({ match, selected, onClick }: PosterCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full rounded-xl border-l-4 p-3 text-left transition-all duration-200',
        selected
          ? 'border-l-primary border-y border-r border-primary/30 bg-primary/5 shadow-sm'
          : 'border-l-muted-foreground/20 border-y border-r border-border bg-card hover:border-l-primary/50 hover:shadow-sm',
      )}
    >
      <div className="flex gap-3">
        {match.posterUrl ? (
          <img
            src={match.posterUrl}
            alt=""
            className="h-28 w-20 shrink-0 rounded-lg object-cover ring-1 ring-black/5 dark:ring-white/10"
          />
        ) : (
          <div className="flex h-28 w-20 shrink-0 items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground">
            No Poster
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="font-medium leading-tight">
            {match.displayName}
            {match.year > 0 && <span className="ml-1 text-muted-foreground">({match.year})</span>}
          </div>
          {match.originalName && match.originalName !== match.displayName && (
            <div className="mt-0.5 truncate text-sm text-muted-foreground">
              {match.originalName}
            </div>
          )}
          <div className="mt-1 flex gap-2 text-xs text-muted-foreground">
            <span>TMDB: {match.id}</span>
            {match.imdbId && <span>IMDB: {match.imdbId}</span>}
          </div>
          {match.overview && (
            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {match.overview}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
