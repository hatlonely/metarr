"use client";

import { cn } from "@/src/renderer/lib/utils";
import type { TMDBMatch } from "@metarr/core";

interface PosterCardProps {
  match: TMDBMatch;
  selected: boolean;
  onClick: () => void;
  locale: "zh" | "en";
}

export function PosterCard({ match, selected, onClick, locale }: PosterCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full rounded-lg border p-3 text-left transition-all",
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "border-border bg-card hover:border-primary/50 hover:bg-accent/50",
      )}
    >
      <div className="flex gap-3">
        {match.posterUrl ? (
          <img
            src={match.posterUrl}
            alt=""
            className="h-28 w-20 shrink-0 rounded-md object-cover"
          />
        ) : (
          <div className="flex h-28 w-20 shrink-0 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
            No Poster
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="font-medium leading-tight">
            {match.displayName}
            {match.year > 0 && (
              <span className="ml-1 text-muted-foreground">({match.year})</span>
            )}
          </div>
          {match.originalName && match.originalName !== match.displayName && (
            <div className="mt-0.5 text-sm text-muted-foreground truncate">
              {match.originalName}
            </div>
          )}
          <div className="mt-1 flex gap-2 text-xs text-muted-foreground">
            <span>TMDB: {match.id}</span>
            {match.imdbId && <span>IMDB: {match.imdbId}</span>}
          </div>
          {match.overview && (
            <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
              {match.overview}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
